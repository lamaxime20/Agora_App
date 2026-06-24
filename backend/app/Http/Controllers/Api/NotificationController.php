<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class NotificationController extends Controller
{
    // ── Helpers ─────────────────────────────────────────────────────────────

    private function currentUser(Request $request)
    {
        return $request->attributes->get('authorizedUser');
    }

    private function currentEntreprise(Request $request)
    {
        return $request->attributes->get('currentEntreprise');
    }

    private function currentRole(Request $request)
    {
        return $request->attributes->get('currentRole');
    }

    private function baseQuery(Request $request)
    {
        $user      = $this->currentUser($request);
        $entreprise = $this->currentEntreprise($request);
        $role      = $this->currentRole($request);

        return Notification::where('user_id', $user->id)
            ->where('company_id', $entreprise->id)
            ->where('role_id', $role->id);
    }

    // ── GET /notifications ──────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        try {
            $page   = max(1, (int) $request->query('page', 1));
            $limit  = min(100, max(1, (int) $request->query('limit', 25)));
            $filter = $request->query('filter', 'all'); // all|unread|read|archived
            $search = trim((string) $request->query('search', ''));

            $query = $this->baseQuery($request);

            match ($filter) {
                'unread'   => $query->whereNull('read_at')->whereNull('archived_at'),
                'read'     => $query->whereNotNull('read_at')->whereNull('archived_at'),
                'archived' => $query->whereNotNull('archived_at'),
                default    => $query->whereNull('archived_at'),
            };

            if ($search !== '') {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'ilike', '%' . $search . '%')
                      ->orWhere('message', 'ilike', '%' . $search . '%');
                });
            }

            $total = $query->count();

            $notifications = $query->orderByDesc('created_at')
                ->forPage($page, $limit)
                ->get()
                ->map(fn($n) => $this->format($n));

            return response()->json([
                'data' => [
                    'notifications' => $notifications,
                    'total'         => $total,
                    'page'          => $page,
                    'limit'         => $limit,
                ],
            ]);
        } catch (\Throwable $e) {
            return $this->errorResponse($e);
        }
    }

    // ── GET /notifications/unread-count ─────────────────────────────────────

    public function unreadCount(Request $request): JsonResponse
    {
        try {
            $count = $this->baseQuery($request)
                ->whereNull('read_at')
                ->whereNull('archived_at')
                ->count();

            return response()->json(['data' => ['count' => $count]]);
        } catch (\Throwable $e) {
            return $this->errorResponse($e);
        }
    }

    // ── PATCH /notifications/{id}/read ──────────────────────────────────────

    public function markRead(Request $request, string $id): JsonResponse
    {
        try {
            $notification = $this->findOrFail($request, $id);
            if (!$notification) {
                return $this->notFound();
            }

            $notification->markAsRead();

            return response()->json(['data' => $this->format($notification->fresh())]);
        } catch (\Throwable $e) {
            return $this->errorResponse($e);
        }
    }

    // ── PATCH /notifications/read-all ───────────────────────────────────────

    public function markAllRead(Request $request): JsonResponse
    {
        try {
            $this->baseQuery($request)
                ->whereNull('read_at')
                ->whereNull('archived_at')
                ->update(['read_at' => now()]);

            return response()->json(['ok' => true]);
        } catch (\Throwable $e) {
            return $this->errorResponse($e);
        }
    }

    // ── PATCH /notifications/{id}/archive ───────────────────────────────────

    public function archive(Request $request, string $id): JsonResponse
    {
        try {
            $notification = $this->findOrFail($request, $id);
            if (!$notification) {
                return $this->notFound();
            }

            $notification->markAsArchived();

            return response()->json(['data' => $this->format($notification->fresh())]);
        } catch (\Throwable $e) {
            return $this->errorResponse($e);
        }
    }

    // ── PATCH /notifications/archive-all ────────────────────────────────────

    public function archiveAll(Request $request): JsonResponse
    {
        try {
            $this->baseQuery($request)
                ->whereNull('archived_at')
                ->update(['archived_at' => now()]);

            return response()->json(['ok' => true]);
        } catch (\Throwable $e) {
            return $this->errorResponse($e);
        }
    }

    // ── DELETE /notifications/{id} ──────────────────────────────────────────

    public function destroy(Request $request, string $id): JsonResponse
    {
        try {
            $notification = $this->findOrFail($request, $id);
            if (!$notification) {
                return $this->notFound();
            }

            $notification->delete();

            return response()->json(['ok' => true]);
        } catch (\Throwable $e) {
            return $this->errorResponse($e);
        }
    }

    // ── DELETE /notifications/bulk ───────────────────────────────────────────

    public function destroyBulk(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'ids'   => 'required|array|min:1|max:100',
                'ids.*' => 'required|uuid',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'ok'     => false,
                    'code'   => 'VALIDATION_ERROR',
                    'errors' => collect($validator->errors()->toArray())->map(fn($e) => $e[0])->toArray(),
                ], 422);
            }

            $this->baseQuery($request)
                ->whereIn('id', $request->input('ids'))
                ->delete();

            return response()->json(['ok' => true]);
        } catch (\Throwable $e) {
            return $this->errorResponse($e);
        }
    }

    // ── DELETE /notifications/archived ──────────────────────────────────────

    public function destroyArchived(Request $request): JsonResponse
    {
        try {
            $this->baseQuery($request)
                ->whereNotNull('archived_at')
                ->delete();

            return response()->json(['ok' => true]);
        } catch (\Throwable $e) {
            return $this->errorResponse($e);
        }
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private function findOrFail(Request $request, string $id): ?Notification
    {
        return $this->baseQuery($request)->where('id', $id)->first();
    }

    private function format(Notification $n): array
    {
        return [
            'id'          => $n->id,
            'type'        => $n->type,
            'title'       => $n->title,
            'message'     => $n->message,
            'priority'    => $n->priority,
            'data'        => $n->data,
            'is_read'     => $n->isRead(),
            'is_archived' => $n->isArchived(),
            'read_at'     => $n->read_at?->toIso8601String(),
            'archived_at' => $n->archived_at?->toIso8601String(),
            'created_at'  => $n->created_at?->toIso8601String(),
        ];
    }

    private function notFound(): JsonResponse
    {
        return response()->json([
            'ok'      => false,
            'code'    => 'NOT_FOUND',
            'message' => 'Notification introuvable.',
        ], 404);
    }

    private function errorResponse(\Throwable $e): JsonResponse
    {
        report($e);

        return response()->json([
            'ok'      => false,
            'code'    => 'INTERNAL_ERROR',
            'message' => 'Une erreur est survenue.',
        ], 500);
    }
}
