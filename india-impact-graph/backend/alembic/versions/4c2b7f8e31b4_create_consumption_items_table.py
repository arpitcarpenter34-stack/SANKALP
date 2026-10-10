"""create_consumption_items_table

Revision ID: 4c2b7f8e31b4
Revises: 12efdfb8841d
Create Date: 2026-10-11 02:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4c2b7f8e31b4'
down_revision: Union[str, Sequence[str], None] = '12efdfb8841d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema to add consumption_items reference table."""
    op.create_table(
        'consumption_items',
        sa.Column('item_id', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('canonical_unit', sa.String(length=50), nullable=False),
        sa.Column('is_calculable', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('is_capital_asset', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('verification_status', sa.String(length=50), nullable=False),
        sa.Column('data_availability', sa.String(length=50), nullable=False),
        sa.Column('source_title', sa.String(length=255), nullable=True),
        sa.Column('table_or_series_id', sa.String(length=255), nullable=True),
        sa.Column('year_or_vintage', sa.String(length=50), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('item_id'),
    )


def downgrade() -> None:
    """Downgrade schema to remove consumption_items table."""
    op.drop_table('consumption_items')
