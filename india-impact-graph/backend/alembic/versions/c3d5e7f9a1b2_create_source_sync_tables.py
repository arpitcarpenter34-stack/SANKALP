"""create_source_sync_tables

Revision ID: c3d5e7f9a1b2
Revises: b1f2e3d4c5a6
Create Date: 2026-10-11 16:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3d5e7f9a1b2'
down_revision: Union[str, Sequence[str], None] = 'b1f2e3d4c5a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema to add data source sync status and refresh run logs."""
    # 1. Create data_source_sync_status table
    op.create_table(
        'data_source_sync_status',
        sa.Column('source_id', sa.String(length=50), nullable=False),
        sa.Column('series_id', sa.String(length=100), nullable=True),
        sa.Column('is_enabled', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('last_check_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_success_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_observation_period', sa.String(length=50), nullable=True),
        sa.Column('records_inserted_last_run', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('records_updated_last_run', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='idle'),
        sa.Column('error_summary', sa.Text(), nullable=True),
        sa.Column('refresh_policy', sa.String(length=50), nullable=False, server_default='monthly'),
        sa.Column('freshness_threshold_days', sa.Integer(), nullable=False, server_default='45'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['series_id'], ['time_series_definitions.series_id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['source_id'], ['data_sources.source_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('source_id')
    )

    # 2. Create data_source_refresh_runs table
    op.create_table(
        'data_source_refresh_runs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('source_id', sa.String(length=50), nullable=False),
        sa.Column('run_timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('run_type', sa.String(length=50), nullable=False, server_default='automated'),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('records_inserted', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('records_updated', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('execution_duration_ms', sa.Float(), nullable=True),
        sa.ForeignKeyConstraint(['source_id'], ['data_sources.source_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_index(
        'ix_data_source_refresh_runs_source_id',
        'data_source_refresh_runs',
        ['source_id'],
        unique=False
    )
    op.create_index(
        'ix_data_source_refresh_runs_run_timestamp',
        'data_source_refresh_runs',
        ['run_timestamp'],
        unique=False
    )


def downgrade() -> None:
    """Downgrade schema to remove sync status and refresh run tables."""
    op.drop_index('ix_data_source_refresh_runs_run_timestamp', table_name='data_source_refresh_runs')
    op.drop_index('ix_data_source_refresh_runs_source_id', table_name='data_source_refresh_runs')
    op.drop_table('data_source_refresh_runs')
    op.drop_table('data_source_sync_status')
