import os
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import List
from app.models.schemas import (
    UploadResponse, ProcessRequest, ProcessResponse,
    AnalysisResult, Document
)
from app.services.processor import get_processor
from app.core.config import settings


router = APIRouter(prefix="/api/v1", tags=["crime-analysis"])
processor = get_processor()


@router.post("/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """Upload a crime report/FIR document for analysis."""
    # Validate file extension
    filename = file.filename or "unknown"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type {ext} not allowed. Allowed: {settings.ALLOWED_EXTENSIONS}"
        )
    
    # Read content
    content = await file.read()
    
    # Validate size
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large")
    
    # Decode text
    try:
        text_content = content.decode('utf-8')
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be valid UTF-8 text")
    
    # Save document
    document = processor.save_document(file.filename, text_content)
    
    return UploadResponse(
        document_id=document.id,
        filename=document.filename,
        message="Document uploaded successfully. Ready for processing."
    )


@router.post("/process", response_model=ProcessResponse)
async def process_document(request: ProcessRequest):
    """Process an uploaded document through the analysis pipeline."""
    try:
        result = processor.process_document(request)
        return ProcessResponse(document_id=request.document_id, result=result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@router.get("/result/{document_id}", response_model=AnalysisResult)
async def get_result(document_id: str):
    """Get analysis result for a processed document."""
    result = processor.get_result(document_id)
    if not result:
        raise HTTPException(status_code=404, detail="Result not found. Process the document first.")
    return result


@router.get("/documents", response_model=List[Document])
async def list_documents():
    """List all uploaded documents."""
    return processor.list_documents()


@router.get("/graph/{document_id}")
async def get_graph_data(document_id: str):
    """Get graph data formatted for visualization."""
    result = processor.get_result(document_id)
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    return result.graph


@router.get("/suspicious/{document_id}")
async def get_suspicious_entities(document_id: str):
    """Get suspicious entities detected in the analysis."""
    result = processor.get_result(document_id)
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    return result.suspicious_entities


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "crime-network-analysis"}