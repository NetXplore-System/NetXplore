import { FaWhatsapp, FaWikipediaW } from 'react-icons/fa';

const ResearchInfo = ({ research }) => {
    const platformIcon = research.platform === 'whatsapp' ? (
        <FaWhatsapp size={20} color="#25D366" />
    ) : (
        <FaWikipediaW size={20} color="#636466" />
    );

    const filters = research.filters ? Object.entries(research.filters)
        .filter(([key, value]) => {
            if (key === 'filter_id' || key === 'research_id' || key === 'created_at') return false;
            
            if (!value && value !== 0) return false;
            if (typeof value === 'string' && value.trim() === '') return false;
            if (typeof value === 'boolean' && !value) return false;
            
            return true;
        })
        .map(([key, value]) => ({
            label: key
                .split('_')
                .map(word => word[0].toUpperCase() + word.slice(1))
                .join(' '),
            value: typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value
        })) : [];

    return (
        <>
            <div className="general-style flex-row justify-content-between align-items-center mb-4">
                <h3 className="fw-bold">{research.research_name}</h3>
                <div className="d-flex align-items-center gap-1">
                    {platformIcon}
                </div>
            </div>

            <div className="mb-4 general-style">
                <h5 className="fw-bold">Description</h5>
                <p className='p-3 bg-light rounded'>{research.description || 'No description provided'}</p>
            </div>

            <div className='general-style'>
                <h5 className="fw-bold">Applied Filters</h5>
                <div className="row g-3 mt-3">
                    {filters.map(filter => (
                        filter.value && (
                            <div key={filter.label} className="col-12 col-md-6 col-lg-4">
                                <div className="p-3 bg-light rounded">
                                    <strong>{filter.label}:</strong> {filter.value}
                                </div>
                            </div>
                        )
                    ))}
                </div>
            </div>
        </>
    );
};

export default ResearchInfo; 