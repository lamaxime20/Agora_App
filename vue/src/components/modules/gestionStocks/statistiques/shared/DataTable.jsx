import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import "../../../../../assets/styles/components/modules/gestionStocks/statsShared.css";

/* ─── DataTable générique ─────────────────────────────────────────────────────── */

function DataTable({ columns, data, emptyText = "Aucune donnée." }) {
    const [sortKey, setSortKey]   = useState(null);
    const [sortDir, setSortDir]   = useState("asc");

    const handleSort = (key) => {
        if (sortKey === key) {
            setSortDir(d => d === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortDir("desc");
        }
    };

    const sorted = useMemo(() => {
        if (!sortKey || !data?.length) return data ?? [];
        return [...data].sort((a, b) => {
            const av = a[sortKey];
            const bv = b[sortKey];
            if (av == null && bv == null) return 0;
            if (av == null) return 1;
            if (bv == null) return -1;
            const cmp = typeof av === "string" ? av.localeCompare(bv) : av - bv;
            return sortDir === "asc" ? cmp : -cmp;
        });
    }, [data, sortKey, sortDir]);

    return (
        <div className="dataTable-wrap">
            <table className="dataTable-table" aria-label="Tableau de données">
                <thead className="dataTable-thead">
                    <tr>
                        {columns.map(col => (
                            <th
                                key={col.key}
                                scope="col"
                                className={`dataTable-th${col.sortable ? " dataTable-th--sortable" : ""}${col.align === "right" ? " dataTable-th--right" : ""}`}
                                onClick={col.sortable ? () => handleSort(col.key) : undefined}
                                aria-sort={
                                    sortKey === col.key
                                        ? sortDir === "asc" ? "ascending" : "descending"
                                        : undefined
                                }
                            >
                                <span className="dataTable-th__content">
                                    {col.label}
                                    {col.sortable && (
                                        <span className="dataTable-th__sort" aria-hidden="true">
                                            {sortKey === col.key
                                                ? sortDir === "asc"
                                                    ? <ChevronUp size={12} />
                                                    : <ChevronDown size={12} />
                                                : <ChevronsUpDown size={12} />
                                            }
                                        </span>
                                    )}
                                </span>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sorted.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="dataTable-empty">
                                {emptyText}
                            </td>
                        </tr>
                    ) : (
                        sorted.map((row, ri) => (
                            <tr key={ri} className="dataTable-row">
                                {columns.map(col => (
                                    <td
                                        key={col.key}
                                        className={`dataTable-td${col.align === "right" ? " dataTable-td--right" : ""}`}
                                    >
                                        {col.render
                                            ? col.render(row[col.key], row)
                                            : (row[col.key] ?? "—")}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default DataTable;
