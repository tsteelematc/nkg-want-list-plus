import { useRef, useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { DEFAULT_CORS_PROXY } from "../types";
import {
  exportAppDataToFile,
  importAppDataFromFile,
} from "../lib/storage";
import { parsePastedHtml, ScrapeError } from "../lib/scraper";

export function SettingsPage() {
  const { data, setCorsProxyUrl, setData, mergeScrapedItems, addSource } =
    useAppData();
  const [proxyInput, setProxyInput] = useState(data.settings.corsProxyUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const [pasteSourceName, setPasteSourceName] = useState("");
  const [pasteHtml, setPasteHtml] = useState("");
  const [pasteMessage, setPasteMessage] = useState<string | null>(null);

  const handleSaveProxy = (e: React.FormEvent) => {
    e.preventDefault();
    setCorsProxyUrl(proxyInput.trim());
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileSelected = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importAppDataFromFile(file);
      setData(imported);
      setImportMessage("Backup imported successfully.");
    } catch (err) {
      setImportMessage(`Failed to import: ${(err as Error).message}`);
    } finally {
      e.target.value = "";
    }
  };

  const handlePasteImport = (e: React.FormEvent) => {
    e.preventDefault();
    setPasteMessage(null);
    if (!pasteSourceName.trim() || !pasteHtml.trim()) {
      setPasteMessage("Provide both a label and the pasted HTML.");
      return;
    }
    try {
      const items = parsePastedHtml(pasteHtml);
      const source = addSource(pasteSourceName.trim(), "(imported from pasted HTML)");
      mergeScrapedItems(source.id, items);
      setPasteMessage(`Imported ${items.length} items from pasted HTML.`);
      setPasteSourceName("");
      setPasteHtml("");
    } catch (err) {
      const message =
        err instanceof ScrapeError ? err.message : (err as Error).message;
      setPasteMessage(`Failed to parse HTML: ${message}`);
    }
  };

  return (
    <div className="page">
      <h1>Settings</h1>

      <section>
        <h2>CORS Proxy</h2>
        <p className="hint">
          Scraping fetches Noble Knight pages through a CORS proxy since
          browsers block cross-origin requests directly. Public proxies can be
          unreliable or rate-limited — swap in your own if needed.
        </p>
        <form className="row-form" onSubmit={handleSaveProxy}>
          <input
            value={proxyInput}
            onChange={(e) => setProxyInput(e.target.value)}
            placeholder={DEFAULT_CORS_PROXY}
          />
          <button type="submit">Save</button>
        </form>
      </section>

      <section>
        <h2>Backup &amp; Restore</h2>
        <p className="hint">
          All data lives only in this browser. Export a JSON backup regularly,
          or to move your data to another device.
        </p>
        <button onClick={() => exportAppDataToFile(data)}>
          Export JSON backup
        </button>
        <button onClick={handleImportClick}>Import JSON backup</button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          style={{ display: "none" }}
          onChange={handleFileSelected}
        />
        {importMessage && <p className="hint">{importMessage}</p>}
      </section>

      <section>
        <h2>Paste HTML Fallback Import</h2>
        <p className="hint">
          If the CORS proxy is down, open the want-list page yourself, copy
          its full page source (View Source / Save Page As → HTML), and paste
          it here to import items without a proxy.
        </p>
        <form onSubmit={handlePasteImport}>
          <input
            placeholder="Label for this source, e.g. Tom's Want List"
            value={pasteSourceName}
            onChange={(e) => setPasteSourceName(e.target.value)}
          />
          <textarea
            placeholder="Paste full page HTML here…"
            rows={8}
            value={pasteHtml}
            onChange={(e) => setPasteHtml(e.target.value)}
          />
          <button type="submit">Import from pasted HTML</button>
        </form>
        {pasteMessage && <p className="hint">{pasteMessage}</p>}
      </section>
    </div>
  );
}
