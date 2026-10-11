"""create_time_series_tables

Revision ID: b1f2e3d4c5a6
Revises: 8a3f5c2d9e14
Create Date: 2026-10-11 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b1f2e3d4c5a6'
down_revision: Union[str, Sequence[str], None] = '8a3f5c2d9e14'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema to add time series definitions and observations tables."""
    # 1. Create time_series_definitions table
    op.create_table(
        'time_series_definitions',
        sa.Column('series_id', sa.String(length=100), nullable=False),
        sa.Column('series_name', sa.String(length=255), nullable=False),
        sa.Column('publisher', sa.String(length=100), nullable=False),
        sa.Column('unit', sa.String(length=50), nullable=False),
        sa.Column('frequency', sa.String(length=50), nullable=False),
        sa.Column('geographic_scope', sa.String(length=100), nullable=False, server_default='All-India'),
        sa.Column('base_year', sa.String(length=50), nullable=True),
        sa.Column('source_id', sa.String(length=50), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['source_id'], ['data_sources.source_id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('series_id')
    )

    # 2. Create time_series_observations table
    op.create_table(
        'time_series_observations',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('series_id', sa.String(length=100), nullable=False),
        sa.Column('reference_period', sa.String(length=50), nullable=False),
        sa.Column('observation_date', sa.String(length=10), nullable=True),
        sa.Column('geographic_scope', sa.String(length=100), nullable=False, server_default='All-India'),
        sa.Column('sector', sa.String(length=50), nullable=False, server_default='Combined'),
        sa.Column('observation_value', sa.Float(), nullable=False),
        sa.Column('unit', sa.String(length=50), nullable=False),
        sa.Column('release_status', sa.String(length=50), nullable=False, server_default='Final'),
        sa.Column('source_title', sa.String(length=255), nullable=True),
        sa.Column('source_url', sa.String(length=1024), nullable=True),
        sa.Column('publication_date', sa.String(length=50), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['series_id'], ['time_series_definitions.series_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(
            'series_id',
            'reference_period',
            'geographic_scope',
            'sector',
            name='uq_time_series_obs_natural_key'
        )
    )

    # Indexes
    op.create_index(
        'ix_time_series_observations_series_id',
        'time_series_observations',
        ['series_id'],
        unique=False
    )
    op.create_index(
        'ix_time_series_obs_series_period',
        'time_series_observations',
        ['series_id', 'reference_period'],
        unique=False
    )
    op.create_index(
        'ix_time_series_obs_series_sector',
        'time_series_observations',
        ['series_id', 'sector'],
        unique=False
    )


def downgrade() -> None:
    """Downgrade schema to remove time series tables."""
    op.drop_index('ix_time_series_obs_series_sector', table_name='time_series_observations')
    op.drop_index('ix_time_series_obs_series_period', table_name='time_series_observations')
    op.drop_index('ix_time_series_observations_series_id', table_name='time_series_observations')
    op.drop_table('time_series_observations')
    op.drop_table('time_series_definitions')
