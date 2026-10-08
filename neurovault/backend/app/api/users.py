from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import User, UserPreference
from app.schemas import UserResponse, UserPreferenceResponse, UserPreferenceUpdate
from app.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.get("/me/preferences", response_model=UserPreferenceResponse)
async def get_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(UserPreference).where(UserPreference.user_id == current_user.id))
    pref = res.scalar_one_or_none()
    if not pref:
        pref = UserPreference(user_id=current_user.id)
        db.add(pref)
        await db.commit()
        await db.refresh(pref)
    return UserPreferenceResponse.model_validate(pref)

@router.patch("/me/preferences", response_model=UserPreferenceResponse)
async def update_preferences(
    pref_in: UserPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(UserPreference).where(UserPreference.user_id == current_user.id))
    pref = res.scalar_one_or_none()
    if not pref:
        pref = UserPreference(user_id=current_user.id)
        db.add(pref)

    for field, val in pref_in.model_dump(exclude_unset=True).items():
        setattr(pref, field, val)

    await db.commit()
    await db.refresh(pref)
    return UserPreferenceResponse.model_validate(pref)
