"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface CSVRow {
  [key: string]: string;
}

export default function ImportPage() {
  const { data: session, status } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importType, setImportType] = useState("clients");
  const [rows, setRows] = useState<CSVRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  if (status === "unauthenticated") redirect("/login");
  const role = (session?.user as any)?.role;
  if (!["SUPER_ADMIN", "MANAGER", "CONSULTANT"].includes(role)) redirect("/dashboard");

  function parseCSV(text: string): { headers: string[]; rows: CSVRow[] } {
    const lines = text.split("\n").filter(line => line.trim());
    if (lines.length === 0) return { headers: [], rows: [] };

    const headers = parseCSVLine(lines[0]);
    const rows: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0 || values.every(v => !v.trim())) continue;

      const row: CSVRow = {};
      headers.forEach((h, idx) => {
        row[h.trim()] = (values[idx] || "").trim();
      });
      rows.push(row);
    }

    return { headers, rows };
  }

  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  function handleFile(file: File) {
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCSV(text);
      if (rows.length === 0) {
        toast.error("No data found in CSV file");
        return;
      }
      setHeaders(headers);
      setRows(rows);
      setImportResult(null);
      toast.success(`Found ${rows.length} records to import`);
    };
    reader.readAsText(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handleImport() {
    if (rows.length === 0) {
      toast.error("No data to import");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, type: importType }),
      });

      const result = await res.json();
      setImportResult(result);
      toast.success(`Imported ${result.imported} records`);
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} errors occurred`);
      }
    } catch (error) {
      toast.error("Import failed");
    } finally {
      setIsLoading(false);
    }
  }

  function resetImport() {
    setRows([]);
    setHeaders([]);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Import Data</h1>
        <p className="text-muted-foreground">Import clients and deals from CSV files</p>
      </div>

      {/* Upload Section */}
      {rows.length === 0 && (
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-6">
              <div className="h-16 w-16 rounded-2xl bg-[#1a71b4]/10 flex items-center justify-center">
                <Upload className="h-8 w-8 text-[#1a71b4]" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground">Upload CSV File</h3>
                <p className="text-sm text-muted-foreground mt-1">Drag and drop or click to select</p>
              </div>

              <div className="flex items-center gap-4 w-full max-w-md">
                <div className="flex-1">
                  <Select value={importType} onValueChange={setImportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Import type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clients">Import Clients</SelectItem>
                      <SelectItem value="deals">Import Deals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div
                className={`w-full max-w-2xl border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
                  dragOver
                    ? "border-[#1a71b4] bg-[#1a71b4]/5"
                    : "border-border hover:border-[#1a71b4]/50 hover:bg-muted/50"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-foreground font-medium">
                  Drop your CSV file here
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse files
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
              </div>

              <div className="text-xs text-muted-foreground space-y-1 text-center">
                <p>Expected columns for clients: company_name, primary_contact_name, estimated_annual_revenue, status, product, business_line</p>
                <p>Files are processed client-side, no data uploaded until you confirm</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Section */}
      {rows.length > 0 && (
        <>
          {/* Back button */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={resetImport} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Upload
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{rows.length} records</span>
              {importResult && (
                <Badge variant={importResult.imported > 0 ? "success" : "warning"}>
                  {importResult.imported} imported
                </Badge>
              )}
            </div>
          </div>

          {/* Data Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-[#1a71b4]" />
                Preview - {importType === "clients" ? "Client Import" : "Deal Import"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-muted">
                    <tr>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground bg-muted">#</th>
                      {headers.slice(0, 8).map((h) => (
                        <th key={h} className="text-left p-3 text-xs font-medium text-muted-foreground bg-muted whitespace-nowrap">
                          {h.replace(/_/g, " ")}
                        </th>
                      ))}
                      {headers.length > 8 && (
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground bg-muted">
                          +{headers.length - 8} more
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 50).map((row, idx) => (
                      <tr key={idx} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="p-3 text-xs text-muted-foreground">{idx + 1}</td>
                        {headers.slice(0, 8).map((h) => (
                          <td key={h} className="p-3 text-sm text-foreground max-w-[200px] truncate">
                            {row[h] || "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 50 && (
                <div className="p-3 text-center text-sm text-muted-foreground border-t border-border">
                  Showing first 50 of {rows.length} records
                </div>
              )}
            </CardContent>
          </Card>

          {/* Import Summary */}
          {importResult && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">Import Complete</h3>
                    <div className="mt-2 flex gap-4 flex-wrap">
                      <Badge variant="success">{importResult.imported} Imported</Badge>
                      {importResult.skipped > 0 && (
                        <Badge variant="warning">{importResult.skipped} Skipped</Badge>
                      )}
                      {importResult.errors.length > 0 && (
                        <Badge variant="danger">{importResult.errors.length} Errors</Badge>
                      )}
                    </div>
                    {importResult.errors.length > 0 && (
                      <div className="mt-3 max-h-32 overflow-y-auto">
                        {importResult.errors.slice(0, 10).map((err, i) => (
                          <p key={i} className="text-sm text-red-500 flex items-start gap-1 mt-1">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            {err}
                          </p>
                        ))}
                        {importResult.errors.length > 10 && (
                          <p className="text-sm text-muted-foreground mt-1">
                            ...and {importResult.errors.length - 10} more errors
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              className="sidebar-gradient"
              onClick={handleImport}
              disabled={isLoading || (importResult?.imported ?? 0) > 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : importResult ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Imported
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import {rows.length} Records
                </>
              )}
            </Button>
            <Button variant="outline" onClick={resetImport}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear & Start Over
            </Button>
          </div>
        </>
      )}
    </div>
  );
}