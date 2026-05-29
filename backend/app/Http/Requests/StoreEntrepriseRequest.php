<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreEntrepriseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nom'                => ['required', 'string', 'max:120'],
            'secteur'            => ['required', 'string', 'max:120'],
            'logo'               => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,svg', 'max:5120'],
            'couleur_primaire'   => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'couleur_secondaire' => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'couleur_tertiaire'  => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'email'              => ['required', 'email', 'max:255'],
            'telephone'          => ['required', 'string', 'max:30'],
            'site_web'           => ['nullable', 'url', 'max:255'],
            'pays'               => ['required', 'string', 'max:80'],
            'ville'              => ['required', 'string', 'max:120'],
            'adresse'            => ['required', 'string', 'max:255'],
            'politique'          => ['required', 'string', 'min:10'],
            'description'        => ['required', 'string', 'min:10', 'max:600'],
        ];
    }

    public function messages(): array
    {
        return [
            'nom.required'                => "Le nom de l'entreprise est obligatoire.",
            'nom.max'                     => "Le nom de l'entreprise ne peut pas dépasser 120 caractères.",
            'secteur.required'            => "Le secteur d'entreprise est obligatoire.",
            'secteur.max'                 => "Le secteur d'entreprise ne peut pas dépasser 120 caractères.",
            'logo.file'                   => 'Le logo doit être un fichier image valide.',
            'logo.mimes'                  => 'Le logo doit être au format jpg, jpeg, png, webp ou svg.',
            'logo.max'                    => 'Le fichier dépasse 5 Mo.',
            'couleur_primaire.regex'      => 'La couleur primaire doit être au format hexadécimal valide.',
            'couleur_secondaire.regex'    => 'La couleur secondaire doit être au format hexadécimal valide.',
            'couleur_tertiaire.regex'     => 'La couleur tertiaire doit être au format hexadécimal valide.',
            'email.required'              => "L'adresse email est obligatoire.",
            'email.email'                 => "L'adresse email n'est pas valide.",
            'email.max'                   => "L'adresse email ne peut pas dépasser 255 caractères.",
            'telephone.required'          => 'Le numéro de téléphone est obligatoire.',
            'telephone.max'               => 'Le numéro de téléphone ne peut pas dépasser 30 caractères.',
            'site_web.url'                => 'Le site web doit être une URL valide.',
            'site_web.max'                => 'Le site web ne peut pas dépasser 255 caractères.',
            'pays.required'               => 'Le pays est obligatoire.',
            'pays.max'                    => 'Le pays ne peut pas dépasser 80 caractères.',
            'ville.required'              => 'La ville est obligatoire.',
            'ville.max'                   => 'La ville ne peut pas dépasser 120 caractères.',
            'adresse.required'            => "L'adresse est obligatoire.",
            'adresse.max'                 => "L'adresse ne peut pas dépasser 255 caractères.",
            'politique.required'          => 'La politique de l’entreprise est obligatoire.',
            'politique.min'               => 'La politique doit contenir au moins 10 caractères.',
            'description.required'        => "La description de l'entreprise est obligatoire.",
            'description.min'             => 'La description doit contenir au moins 10 caractères.',
            'description.max'             => 'La description ne peut pas dépasser 600 caractères.',
        ];
    }

    protected function failedValidation(ValidatorContract $validator): void
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Les données envoyées sont invalides.',
            'code'    => 'VALIDATION_ERROR',
            'errors'  => $validator->errors(),
        ], 422));
    }
}
