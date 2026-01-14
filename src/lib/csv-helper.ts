
export function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
    // UTF-8 BOM for Excel compatibility
    const BOM = "\uFEFF";

    // Convert rows to CSV format:
    // 1. Map each cell:
    //    - If string, wrap in quotes and escape existing quotes
    //    - If number, keep as is
    // 2. Join cells with comma
    // 3. Join rows with newline

    const processCell = (cell: string | number | null | undefined) => {
        if (cell === null || cell === undefined) return '""';
        const stringCell = String(cell);
        // Escape quotes by doubling them (standard CSV)
        return `"${stringCell.replace(/"/g, '""')}"`;
    };

    const csvContent = [
        headers.map(h => processCell(h)).join(','),
        ...rows.map(row => row.map(cell => processCell(cell)).join(','))
    ].join('\n');

    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
