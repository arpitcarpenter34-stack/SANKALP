"""create_data_sources_table

Revision ID: 9e2f4a1b7c85
Revises: 7d1a2f9b84e3
Create Date: 2026-10-11 06:56:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9e2f4a1b7c85'
down_revision: Union[str, Sequence[str], None] = '7d1a2f9b84e3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema to add data_sources reference table."""
    op.create_table(
        'data_sources',
        sa.Column('source_id', sa.String(length=50), nullable=False),
        sa.Column('source_title', sa.String(length=255), nullable=False),
        sa.Column('publisher', sa.String(length=255), nullable=False),
        sa.Column('series_or_table_id', sa.String(length=255), nullable=True),
        sa.Column('base_year', sa.String(length=50), nullable=True),
        sa.Column('frequency', sa.String(length=50), nullable=True),
        sa.Column('geographic_coverage', sa.String(length=100), nullable=True),
        sa.Column('source_url', sa.String(length=512), nullable=True),
        sa.Column('verification_status', sa.String(length=50), nullable=False, server_default='[VERIFY]'),
        sa.Column('access_condition', sa.String(length=50), nullable=False, server_default='public_open'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('source_id'),
    )


def downgrade() -> None:
    """Downgrade schema to remove data_sources table."""
    op.drop_table('data_sources')
