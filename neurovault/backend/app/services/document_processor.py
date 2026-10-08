import io
import csv
import pandas as pd
from typing import Dict, Any, List, Optional
import pypdf
import docx

class DocumentProcessorService:
    @staticmethod
    async def extract_text_from_file(filename: str, content: bytes) -> Dict[str, Any]:
        """
        Parses PDF, DOCX, CSV, TXT, JSON, and MD files.
        Extracts raw text, page breakdowns, table structures (if tabular), and metadata.
        """
        ext = filename.lower().split(".")[-1]
        raw_text = ""
        tabular_data = None
        record_count = 0
        page_stats = []

        try:
            if ext == "pdf":
                reader = pypdf.PdfReader(io.BytesIO(content))
                text_parts = []
                for idx, page in enumerate(reader.pages):
                    t = page.extract_text() or ""
                    clean_t = t.strip()
                    if clean_t:
                        words_in_page = len(clean_t.split())
                        text_parts.append(f"--- Page {idx + 1} ---\n{clean_t}")
                        page_stats.append({
                            "name": f"Page {idx + 1}",
                            "value": words_in_page
                        })
                raw_text = "\n\n".join(text_parts)

            elif ext in ["docx", "doc"]:
                doc = docx.Document(io.BytesIO(content))
                text_parts = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
                raw_text = "\n".join(text_parts)

            elif ext == "csv":
                df = pd.read_csv(io.BytesIO(content))
                record_count = len(df)
                raw_text = f"CSV Dataset: {filename} ({len(df)} rows, {len(df.columns)} columns)\n"
                raw_text += f"Columns: {', '.join(df.columns)}\n"
                raw_text += "Sample Rows:\n" + df.head(10).to_string()
                tabular_data = {
                    "columns": list(df.columns),
                    "rows": df.head(50).fillna("").to_dict(orient="records"),
                    "total_rows": len(df)
                }

            elif ext in ["xlsx", "xls"]:
                df = pd.read_excel(io.BytesIO(content))
                record_count = len(df)
                raw_text = f"Excel Dataset: {filename} ({len(df)} rows, {len(df.columns)} columns)\n"
                raw_text += f"Columns: {', '.join(df.columns)}\n"
                raw_text += "Sample Rows:\n" + df.head(10).to_string()
                tabular_data = {
                    "columns": list(df.columns),
                    "rows": df.head(50).fillna("").to_dict(orient="records"),
                    "total_rows": len(df)
                }

            elif ext in ["txt", "md", "json", "sql"]:
                raw_text = content.decode("utf-8", errors="ignore")

            else:
                raw_text = content.decode("utf-8", errors="ignore")

        except Exception as e:
            raw_text = f"Error extracting {filename}: {str(e)}"

        words = raw_text.split()
        return {
            "filename": filename,
            "extension": ext,
            "text": raw_text.strip(),
            "char_count": len(raw_text),
            "word_count": len(words),
            "page_stats": page_stats,
            "page_count": len(page_stats) if page_stats else 1,
            "tabular_data": tabular_data,
            "record_count": record_count
        }

document_processor = DocumentProcessorService()
