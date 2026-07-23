from fastapi import APIRouter

from app.api.v1.endpoints import analytics, auth, fields, forms, health, public, responses

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(forms.router, prefix="/forms", tags=["forms"])
api_router.include_router(fields.router, prefix="/forms", tags=["fields"])
api_router.include_router(responses.router, prefix="/forms", tags=["responses"])
api_router.include_router(analytics.router, prefix="/forms", tags=["analytics"])
api_router.include_router(public.router, prefix="/public/forms", tags=["public"])
