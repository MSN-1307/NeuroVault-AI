from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models import User
from app.dependencies import get_current_user
from app.services.document_processor import document_processor
from app.services.document_analysis_service import document_analyzer
from app.services.memory_pipeline import MemoryPipelineService

router = APIRouter(prefix="/documents", tags=["Document Intelligence & File Upload"])

@router.post("/upload-and-analyze")
async def upload_and_analyze_document(
    file: UploadFile = File(...),
    question: Optional[str] = Form(None),
    auto_extract_memories: Optional[bool] = Form(True),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Receives PDF, DOCX, CSV, TXT files:
    1. Extracts raw text and tabular structures
    2. Answers user questions / generates comprehensive summary
    3. Generates structured graph/chart metrics for Recharts
    4. Optionally ingests key extracted facts into user's MySQL memory vault
    """
    try:
        content_bytes = await file.read()
        extraction = await document_processor.extract_text_from_file(file.filename, content_bytes)

        if not extraction["text"]:
            raise HTTPException(status_code=400, detail="Could not extract text from uploaded file.")

        # Analyze with AI & Tabular Intelligence
        analysis = await document_analyzer.analyze_document_content(
            filename=file.filename,
            content_text=extraction["text"],
            user_query=question,
            tabular_data=extraction.get("tabular_data"),
            page_stats=extraction.get("page_stats")
        )

        # Ingest key knowledge into MySQL memory store if requested
        extracted_memories_count = 0
        if auto_extract_memories:
            pipeline = MemoryPipelineService(db)
            summary_snippet = f"Document '{file.filename}': " + extraction["text"][:300]
            memories_info, _, _ = await pipeline.process_message_memories(
                user_id=current_user.id,
                message_id=None,
                conversation_id=None,
                message_content=summary_snippet
            )
            extracted_memories_count = len(memories_info)

        return {
            "filename": file.filename,
            "extension": extraction["extension"],
            "word_count": extraction["word_count"],
            "page_count": extraction.get("page_count", 1),
            "tabular_data": extraction["tabular_data"],
            "answer": analysis["answer"],
            "has_visual_chart": analysis["has_visual_chart"],
            "chart_type": analysis["chart_type"],
            "chart_title": analysis.get("chart_title", "Document Metric Trajectory"),
            "chart_data": analysis["chart_data"],
            "key_metrics": analysis.get("key_metrics", []),
            "extracted_entities": analysis.get("extracted_entities", []),
            "extracted_facts": analysis.get("extracted_facts", []),
            "page_stats": analysis.get("page_stats", []),
            "read_time_minutes": analysis.get("read_time_minutes", 1),
            "extracted_memories_count": extracted_memories_count
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")
