import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { toast } from 'sonner';

import Modal from './Modal';
import Report, { formatFilterLabel } from './Report';

import '../../styles/made-report.css';

const MadeReport = ({
    selectedMetric,
    name,
    fileName,
    params,
    setShowDownload,
    hasComparison,
    networkData,
    communities,
    comparisonFilters,
    comparisonFiles
}) => {
    const { tableData } = useSelector((state) => state.table);
    const { main, comparison: { source, comparison } } = useSelector((state) => state.images);
    const { currentUser } = useSelector((state) => state.user);

    const [research, setResearch] = useState({
        name: name || 'unknown',
        fileName: fileName || 'unknown',
        researcherName: currentUser?.name || 'unknown',
        date: new Date().toISOString().split('T')[0],
        filters: params ? Array.from(params).map(([key, value]) => `${key}: ${value}`) : [],
        conclusion: '',
        hasComparison,
        metric: selectedMetric,
        stats: tableData || [],
        networkData: networkData || {},
        communities: communities || [],
        comparisonFiles: comparisonFiles || []
    });
    const [show, setShow] = useState({
        images: [
            ...main.map((data) => ({ ...data, selected: true, description: '' })),
            ...source.map((data) => ({ ...data, selected: true, description: '' })),
            ...comparison.map((data) => ({ ...data, selected: true, description: '' })),
        ],
        filters: research.filters.map((_, index) => ({ index, selected: true })),
        comparisonFilters: comparisonFilters?.map((filters) => {
            return Object.entries({
                ...filters.timeFrame,
                anonymize: filters.config.anonymize,
                ...(filters.config.directed ? filters.config : {}),
                ...filters.limit,
                ...filters.messageCriteria,
                ...filters.userFilters
            }).filter(([key, value]) => value !== '' && value !== null && value !== undefined && key !== 'type' && key !== 'enabled')
                .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
        }) || []
    });


    const handleChange = (e, index) => {
        e.stopPropagation();
        const updatedImages = [...show.images];
        updatedImages[index].description = e.target.value;
        setShow((prev) => ({ ...prev, images: updatedImages }));
    }

    const handleToggle = (index, key) => {
        setShow((prev) => {
            const updated = [...prev[key]];
            updated[index].selected = !updated[index].selected;
            return { ...prev, [key]: updated };
        });
    }

    const closeModal = (e) => { e.stopPropagation(); setShowDownload(false) };


    useEffect(() => {
        !show.images.length && toast.info('It\'s recommended to add images to the report. You can\'t see the comparison without images.');
    }, []);

    return (
        <Modal onClose={closeModal} showCloseButton={false}>
            <div className="general-style research-report-header flex-row " >
                <h2>Research Report</h2>
                <button className="close-btn" onClick={closeModal}>×</button>
            </div>

            <div className="general-style research-report-info" >
                <h3>Research Information</h3>
                <p>Research Name: {research.name}</p>
                <p>Researcher Name: {research.researcherName}</p>
            </div>
            <div className="general-style flex-row research-report-images">
                <h3>Include Images</h3>
                {show.images.map((image, index) => (
                    <div key={index} className="image-selection">
                        <p className="image-description">
                            {
                                image.type === 'main' ? 'Main Image' :
                                    image.type === 'source' ? 'Source Image' :
                                        image.type === 'comparison' ? `Comparison Image (from comparison number: ${image.index + 1})` : 'Unknown Type'
                            }
                        </p>
                        <label>
                            <img src={image.data} alt={`Graph ${index + 1}`} style={{ height: '100px', width: '100px' }} />
                            <input
                                type="checkbox"
                                id={`image-selection-${index}`}
                                checked={show.images[index]?.selected}
                                onChange={() => handleToggle(index, 'images')}
                            />
                            {show.images[index]?.selected ? 'Include this image' : 'Exclude this image'}
                        </label>
                        <input
                            type="text"
                            placeholder="Image description"
                            id={`image-description-${index}`}
                            maxLength={60}
                            value={show.images[index]?.description}
                            onChange={e => handleChange(e, index)}
                        />
                    </div>
                ))}
                {show.images.length === 0 && <p>No images available to include.</p>}
            </div>

            <div className="general-style flex-row research-report-filters">
                <h3>Include Filters</h3>
                {research.filters.map((filter, index) => (
                    <div key={index} className="filter-selection">
                        <label>
                            <input
                                type="checkbox"
                                id={`filter-selection-${index}`}
                                checked={show.filters[index]?.selected}
                                onChange={() => handleToggle(index, 'filters')}
                            />
                            {formatFilterLabel(filter)}
                        </label>
                    </div>
                ))}
                {research.filters.length === 0 && <p>No filters available to include.</p>}
            </div>
            <form className="general-style research-report-form" >
                <div>
                    <label htmlFor="conclusion" className='mb-3'>Research Conclusion. (is required)</label>
                    <textarea
                        id="conclusion"
                        value={research.conclusion}
                        onChange={(e) => setResearch(prevResearch => ({ ...prevResearch, conclusion: e.target.value }))}
                        placeholder="Enter your research conclusion or findings."
                        maxLength={500}
                    />
                </div>

                {hasComparison && <div className="comparison-checkbox">
                    <input
                        type="checkbox"
                        id="hasComparison"
                        checked={research.hasComparison && show.images.some(img => img.selected)}
                        onChange={(e) => setResearch(prevResearch => ({ ...prevResearch, hasComparison: e.target.checked }))}
                    />
                    <label htmlFor="hasComparison">Include Comparison</label>
                </div>}

                <div className="research-report-actions">
                    <button type="button" className="action-btn me-2 btn btn-primary" onClick={closeModal}>
                        Cancel
                    </button>

                    {research.name && research.researcherName && research.conclusion && (
                        <PDFDownloadLink
                            document={<Report research={research} show={show} />}
                            fileName="research_report.pdf"
                            className="download-link"
                            onClick={(e) => {
                                setTimeout(() => {
                                    e.stopPropagation();
                                    setShowDownload(false);
                                }, 1000);
                            }}
                        >
                            {({ loading }) => (loading ? <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Preparing...</> : 'Download Report')}
                        </PDFDownloadLink>
                    )}
                </div>
            </form>
        </Modal>
    );
};
export default MadeReport;