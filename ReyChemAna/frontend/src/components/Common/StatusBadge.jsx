/**
 * Status badge component
 */
import { STATUS_LABELS, STATUS_COLORS } from '../../utils/constants';

export default function StatusBadge({ status }) {
    const color = STATUS_COLORS[status] || '#6b7280';
    const label = STATUS_LABELS[status] || status;

    return (
        <span style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.875rem',
            fontWeight: '500',
            backgroundColor: `${color}20`,
            color: color,
            display: 'inline-block'
        }}>
            {label}
        </span>
    );
}
