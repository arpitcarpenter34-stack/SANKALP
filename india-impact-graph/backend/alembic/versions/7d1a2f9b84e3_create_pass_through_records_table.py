"""create_pass_through_records_table

Revision ID: 7d1a2f9b84e3
Revises: 4c2b7f8e31b4
Create Date: 2026-10-11 06:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7d1a2f9b84e3'
down_revision: Union[str, Sequence[str], None] = '4c2b7f8e31b4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema to add pass_through_records reference table."""
    op.create_table(
        'pass_through_records',
        sa.Column('upstream_commodity', sa.String(length=50), nullable=False),
        sa.Column('downstream_item', sa.String(length=50), nullable=False),
        sa.Column('pass_through_factor_low', sa.Float(), nullable=True),
        sa.Column('pass_through_factor_high', sa.Float(), nullable=True),
        sa.Column('unit', sa.String(length=50), nullable=False, server_default='elasticity_coefficient'),
        sa.Column('time_lag_months', sa.String(length=50), nullable=True),
        sa.Column('historical_basis_source', sa.String(length=255), nullable=True),
        sa.Column('verification_status', sa.String(length=50), nullable=False, server_default='[VERIFY]'),
        sa.Column('caveats', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('upstream_commodity', 'downstream_item'),
    )


def downgrade() -> None:
    """Downgrade schema to remove pass_through_records table."""
    op.drop_table('pass_through_records')
