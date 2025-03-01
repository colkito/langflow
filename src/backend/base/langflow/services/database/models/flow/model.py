# Path: src/backend/langflow/services/database/models/flow/model.py

import warnings
from datetime import datetime
from typing import TYPE_CHECKING, Dict, Optional
from uuid import UUID, uuid4

import emoji
from emoji import purely_emoji  # type: ignore
from pydantic import field_serializer, field_validator
from sqlmodel import JSON, Column, Field, Relationship, SQLModel

from langflow.schema.schema import Record

if TYPE_CHECKING:
    from langflow.services.database.models.user import User


class FlowBase(SQLModel):
    name: str = Field(index=True)
    description: Optional[str] = Field(index=True, nullable=True, default=None)
    icon: Optional[str] = Field(default=None, nullable=True)
    icon_bg_color: Optional[str] = Field(default=None, nullable=True)
    data: Optional[Dict] = Field(default=None, nullable=True)
    is_component: Optional[bool] = Field(default=False, nullable=True)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow, nullable=True)
    folder: Optional[str] = Field(default=None, nullable=True)

    @field_validator("icon_bg_color")
    def validate_icon_bg_color(cls, v):
        if v is not None and not isinstance(v, str):
            raise ValueError("Icon background color must be a string")
        # validate that is is a hex color
        if v and not v.startswith("#"):
            raise ValueError("Icon background color must start with #")

        # validate that it is a valid hex color
        if v and len(v) != 7:
            raise ValueError("Icon background color must be 7 characters long")
        return v

    @field_validator("icon")
    def validate_icon_atr(cls, v):
        #   const emojiRegex = /\p{Emoji}/u;
        # const isEmoji = emojiRegex.test(data?.node?.icon!);
        # emoji pattern in Python
        if v is None:
            return v
        # we are going to use the emoji library to validate the emoji
        # emojis can be defined using the :emoji_name: syntax

        if not v.startswith(":") and not v.endswith(":"):
            return v
        elif not v.startswith(":") or not v.endswith(":"):
            # emoji should have both starting and ending colons
            # so if one of them is missing, we will raise
            raise ValueError(f"Invalid emoji. {v} is not a valid emoji.")

        emoji_value = emoji.emojize(v, variant="emoji_type")
        if v == emoji_value:
            warnings.warn(f"Invalid emoji. {v} is not a valid emoji.")
            icon = v
        icon = emoji_value

        if purely_emoji(icon):
            # this is indeed an emoji
            return icon
        # otherwise it should be a valid lucide icon
        if v is not None and not isinstance(v, str):
            raise ValueError("Icon must be a string")
        # is should be lowercase and contain only letters and hyphens
        if v and not v.islower():
            raise ValueError("Icon must be lowercase")
        if v and not v.replace("-", "").isalpha():
            raise ValueError("Icon must contain only letters and hyphens")
        return v

    @field_validator("data")
    def validate_json(v):
        if not v:
            return v
        if not isinstance(v, dict):
            raise ValueError("Flow must be a valid JSON")

        # data must contain nodes and edges
        if "nodes" not in v.keys():
            raise ValueError("Flow must have nodes")
        if "edges" not in v.keys():
            raise ValueError("Flow must have edges")

        return v

    # updated_at can be serialized to JSON
    @field_serializer("updated_at")
    def serialize_dt(self, dt: datetime, _info):
        if dt is None:
            return None
        return dt.isoformat()

    @field_validator("updated_at", mode="before")
    def validate_dt(cls, v):
        if v is None:
            return v
        elif isinstance(v, datetime):
            return v

        return datetime.fromisoformat(v)


class Flow(FlowBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True, unique=True)
    data: Optional[Dict] = Field(default=None, sa_column=Column(JSON))
    user_id: Optional[UUID] = Field(index=True, foreign_key="user.id", nullable=True)
    user: "User" = Relationship(back_populates="flows")

    def to_record(self):
        serialized = self.model_dump()
        data = {
            "id": serialized.pop("id"),
            "data": serialized.pop("data"),
            "name": serialized.pop("name"),
            "description": serialized.pop("description"),
            "updated_at": serialized.pop("updated_at"),
        }
        record = Record(data=data)
        return record


class FlowCreate(FlowBase):
    user_id: Optional[UUID] = None


class FlowRead(FlowBase):
    id: UUID
    user_id: Optional[UUID] = Field()


class FlowUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None
    data: Optional[Dict] = None
