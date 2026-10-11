"""create_cached_articles_table

Revision ID: 8a3f5c2d9e14
Revises: 9e2f4a1b7c85
Create Date: 2026-10-11 08:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8a3f5c2d9e14'
down_revision: Union[str, Sequence[str], None] = '9e2f4a1b7c85'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema to add cached_articles reference table."""
    op.create_table(
        'cached_articles',
        sa.Column('article_id', sa.String(length=100), nullable=False),
        sa.Column('event_name', sa.String(length=255), nullable=False),
        sa.Column('headline', sa.Text(), nullable=False),
        sa.Column('publisher', sa.String(length=255), nullable=False),
        sa.Column('publication_date', sa.String(length=50), nullable=True),
        sa.Column('event_date', sa.String(length=50), nullable=True),
        sa.Column('source_url', sa.String(length=1024), nullable=True),
        sa.Column('local_cache_path', sa.String(length=512), nullable=True),
        sa.Column('reported_event_magnitude', sa.String(length=100), nullable=True),
        sa.Column('verification_status', sa.String(length=50), nullable=False, server_default='[VERIFY]'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('article_id'),
    )


def downgrade() -> None:
    """Downgrade schema to remove cached_articles table."""
    op.drop_table('cached_articles')
