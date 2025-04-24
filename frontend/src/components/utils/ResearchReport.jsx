import { Page, Text, View, Document, StyleSheet, PDFDownloadLink, Font, Image } from '@react-pdf/renderer';
import { useState, useEffect } from 'react';
import './style.css';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import Modal from './Modal';


const formatFilterLabel = (filter) => {
    const [key] = filter.split(':');
    return key
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
        .join(' ');
};

Font.register({
    family: 'Alef',
    src: '/Alef/Alef-Regular.ttf',
});

// Define styles with improved aesthetics
const styles = StyleSheet.create({
    page: {
        padding: 40,
        backgroundColor: '#FCFCFC',
        fontFamily: 'Alef',
    },
    header: {
        marginBottom: 20,
        borderBottom: '1px solid #050d2d',
        paddingBottom: 10,
    },
    headerTitle: {
        fontSize: 24,
        color: '#050d2d',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    section: {
        marginBottom: 20,
        padding: 10,
        backgroundColor: '#F8F9FA',
        borderRadius: 5,
    },
    sectionTitle: {
        fontSize: 16,
        marginBottom: 10,
        color: '#158582',
        fontWeight: 'bold',
        borderBottom: '1px solid #DDD',
        paddingBottom: 5,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    label: {
        width: '30%',
        fontSize: 12,
        color: '#555',
        fontWeight: 'bold',
    },
    value: {
        width: '70%',
        fontSize: 12,
        color: '#333',
    },
    filterItem: {
        margin: 3,
        padding: '3 8',
        backgroundColor: '#e0f2f1',
        borderRadius: 10,
        fontSize: 10,
        color: '#00796b',
        display: 'inline-block',
    },
    filtersContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 5,
    },
    conclusion: {
        fontSize: 12,
        lineHeight: 1.6,
        color: '#333',
        textAlign: 'justify',
    },
    comparison: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#e3f2fd',
        borderRadius: 5,
        fontSize: 12,
        color: '#1565c0',
        textAlign: 'center',
    },
    metricHighlight: {
        backgroundColor: '#f0f7f6',
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
        borderLeft: '4px solid #158582',
    },
    metricText: {
        fontSize: 12,
        color: '#2a625e',
        fontWeight: 'semibold',
    },
    graphSection: {
        marginVertical: 15,
        padding: 10,
        backgroundColor: '#FFF',
        borderRadius: 8,
        border: '1px solid #E0E0E0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    },
    graphTitle: {
        fontSize: 14,
        color: '#158582',
        marginBottom: 8,
        fontWeight: 'semibold',
    },
    comparisonSection: {
        marginTop: 15,
        paddingTop: 15,
        borderTop: '1px solid #DDD',
    },
    comparisonTitle: {
        fontSize: 14,
        color: '#1565c0',
        fontWeight: 'bold',
        marginBottom: 5,
        textAlign: 'center',
    },
    graphImage: {
        width: '100%',
        height: 210,
        borderRadius: 4,
        marginTop: 10,
        border: '1px solid #EEE',
    },
    comparisonImage: {
        width: '75%', // Ensure the image takes up the full width of its container
        height: 300,
        borderRadius: 4,
        border: '1px solid #EEE',
    },
    comparisonImagesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap', // Allow wrapping to ensure each image container can take full width
        justifyContent: 'center', // Center the content
        // marginVertical: 10,
    },
    comparisonImageContainer: {
        flexBasis: '100%', 
        display: 'flex', // Use flexbox for alignment within each grid item
        flexDirection: 'column', 
        alignItems: 'center',
        textAlign: 'center',
        marginBottom: 10, // Add spacing between rows
    },
    comparisonTable: {
        width: '100%',
        marginTop: 115,
        marginBottom: 15,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#DDD',
        backgroundColor: '#FFF',
    },
    tableHeader: {
        width: '20%',
        padding: 8,
        backgroundColor: '#F5F5F5',
        fontSize: 10,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        borderBottom: 1,
        borderBottomColor: '#DDD',
    },
    tableCell: {
        width: '20%',
        padding: 8,
        fontSize: 10,
        textAlign: 'center',
        color: '#444',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        color: '#888',
        fontSize: 10,
        borderTop: '1px solid #DDD',
        paddingTop: 10,
    },
    dateText: {
        position: 'absolute',
        top: 30,
        right: 30,
        fontSize: 10,
        color: '#666',
    },
    hebrewText: {
        direction: 'rtl',
        textAlign: 'right',
        fontFamily: 'Alef',
    },
    imageCaption: {
        fontSize: 10,
        color: '#666',
        textAlign: 'center',
        marginTop: 5,
    },
});

// Create Document Component
const ResearchReport = ({ research, images, show }) => {
    const mainImage = show.images.filter((image) => image.data.type === "main" && image.selected)[0];
    const sourceComparisonImage = show.images.filter((image) => image.data.type === "comparison" && image.data.source && image.selected)[0];
    const comparisonImages = show.images.filter((image) => image.data.type === "comparison" && !image.data.source && image.selected);
    const filters = show.filters.filter((filter) => filter.selected).map((filter) => research.filters[filter.index]);

    return (
        <Document>
            <Page style={styles.page}>
                {/* Header Section */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Research Report</Text>
                </View>
                {mainImage && (
                    <View style={styles.graphSection}>
                        <Text style={styles.graphTitle}>Network Graph Visualization</Text>
                        <Image
                            style={styles.graphImage}
                            src={mainImage.data.data}
                            alt="Network Graph"
                        />
                        <Text style={styles.imageCaption}>
                            Fig. 1: Visual representation of the analyzed network structure
                            {mainImage.description && ` - ${mainImage.description}`}
                        </Text>
                    </View>
                )}
                {/* Research Info Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Research Information</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Research Name:</Text>
                        <Text style={styles.value}>{research.name}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Researcher:</Text>
                        <Text style={styles.value}>{research.researcherName}</Text>
                    </View>
                    <View style={styles.metricHighlight}>
                        <Text style={styles.metricText}>
                            Primary Analysis Metric: {research.metric || 'No specific metric selected'}
                        </Text>
                    </View>
                </View>

                {filters && <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Applied Filters</Text>
                    <View style={styles.filtersContainer}>
                        {filters.map((filter, index) => (
                            <Text key={index} style={styles.filterItem}>
                                {`${formatFilterLabel(filter)}: ${filter.split(':')[1].trim()}`}
                            </Text>
                        ))}
                    </View>
                </View>}

                {/* Conclusion Section */}
                <View style={[styles.section, { marginTop: 50 }]}>
                    <Text style={styles.sectionTitle}>Research Conclusion</Text>
                    <Text style={styles.conclusion}>{research.conclusion || research.review}</Text>
                </View>

                {research.hasComparison && (
                    <View style={styles.comparison}>
                        <Text>This research includes {research.stats.length} comparison studies.</Text>
                    </View>
                )}
            </Page>
            {research.hasComparison && comparisonImages.map((data, index) => {
                const comparisonStats = research.stats.filter(state => state.index === data.data.index)[0];

                return (
                    <Page key={index} style={styles.page}>
                        <Text style={styles.pageNumber}>Page {index + 2}</Text>


                        <View key={index} style={styles.comparisonSection}>
                            <Text style={styles.comparisonTitle}>
                                Comparison #{index + 1} Page: {comparisonStats.fileName}
                            </Text>

                            <View style={styles.comparisonImagesContainer}>
                                {sourceComparisonImage &&
                                    <View style={styles.comparisonImageContainer}>
                                        <Image
                                            style={styles.comparisonImage}
                                            src={sourceComparisonImage.data.data}
                                        />
                                        {sourceComparisonImage.description && <Text style={styles.imageCaption}>{sourceComparisonImage.description}</Text>}
                                    </View>
                                }
                                <View style={styles.comparisonImageContainer}>
                                    <Image
                                        style={styles.comparisonImage}
                                        src={data.data.data}
                                    />
                                    {data.description && <Text style={styles.imageCaption}>{data.description}</Text>}
                                </View>
                            </View>

                            <View style={[styles.comparisonTable, { height: '250px' }]}>
                                <View style={[styles.tableRow, { backgroundColor: '#F5F5F5' }]}>
                                    <Text style={styles.tableHeader}>Metric</Text>
                                    <Text style={styles.tableHeader}>Original Network</Text>
                                    <Text style={styles.tableHeader}>Comparison Network</Text>
                                    <Text style={styles.tableHeader}>Difference</Text>
                                    <Text style={styles.tableHeader}>Change %</Text>
                                </View>

                                <View style={styles.tableRow}>
                                    <Text style={styles.tableCell}>Node Count</Text>
                                    <Text style={styles.tableCell}>{comparisonStats.originalNodeCount}</Text>
                                    <Text style={styles.tableCell}>{comparisonStats.comparisonNodeCount}</Text>
                                    <Text style={styles.tableCell}>
                                        {comparisonStats.nodeDifference > 0 ?
                                            `+${comparisonStats.nodeDifference}` :
                                            comparisonStats.nodeDifference}
                                    </Text>
                                    <Text style={styles.tableCell}>{comparisonStats.nodeChangePercent}%</Text>
                                </View>

                                <View style={styles.tableRow}>
                                    <Text style={styles.tableCell}>Edge Count</Text>
                                    <Text style={styles.tableCell}>{comparisonStats.originalLinkCount}</Text>
                                    <Text style={styles.tableCell}>{comparisonStats.comparisonLinkCount}</Text>
                                    <Text style={styles.tableCell}>
                                        {comparisonStats.linkDifference > 0 ?
                                            `+${comparisonStats.linkDifference}` :
                                            comparisonStats.linkDifference}
                                    </Text>
                                    <Text style={styles.tableCell}>{comparisonStats.linkChangePercent}%</Text>
                                </View>

                                <View style={styles.tableRow}>
                                    <Text style={styles.tableCell}>Common Nodes</Text>
                                    <Text style={[styles.tableCell, { width: '40%' }]}>
                                        {comparisonStats.commonNodesCount}
                                    </Text>
                                    <Text style={[styles.tableCell, { width: '40%' }]}>
                                        {((comparisonStats.commonNodesCount / comparisonStats.originalNodeCount) * 100).toFixed(2)}% of original network
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.footer} fixed>
                            <Text>Generated on {new Date().toLocaleDateString()} - Network Analysis Platform</Text>
                        </View>
                    </Page>
                )
            })}
        </Document>
    )
};



const MyResearchReport = ({ selectedMetric, name, params, setShowDownload, hasComparison }) => {
    const { tableData } = useSelector((state) => state.table);
    const { images } = useSelector((state) => state.images);
    const { currentUser } = useSelector((state) => state.user);

    const [research, setResearch] = useState({
        name: name || 'unknown',
        researcherName: currentUser?.name || 'unknown',
        date: new Date().toISOString().split('T')[0],
        filters: params ? Array.from(params).map(([key, value]) => `${key}: ${value}`) : [],
        conclusion: '',
        hasComparison,
        metric: selectedMetric,
        stats: tableData || [],
    });
    const [show, setShow] = useState({
        images: images.map((_, index) => ({ data: _, index, selected: true, description: '' })),
        filters: research.filters.map((_, index) => ({ index, selected: true })),
    });

    const handleCange = (e, index) => {
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

    return (
        <Modal onClose={closeModal}>
            <div className="research-report-header" >
                <h2>Research Report</h2>
                <button className="close-btn" onClick={closeModal}>×</button>
            </div>

            <div className="research-report-info" >
                <h3>Research Information</h3>
                <p>Research Name: {research.name}</p>
                <p>Researcher Name: {research.researcherName}</p>
            </div>
            <div className="research-report-images">
                <h3>Include Images</h3>
                {images.map((image, index) => (
                    <div key={index} className="image-selection">
                        <img src={image.data} alt={`Graph ${index + 1}`} style={{ height: '100px', width: '100px' }} />
                        <label>
                            <input
                                type="checkbox"
                                checked={show.images[index]?.selected}
                                onChange={() => handleToggle(index, 'images')}
                            />
                            Include this image
                        </label>
                        <input
                            type="text"
                            placeholder="Image description"
                            maxLength={60}
                            value={show.images[index]?.description}
                            onChange={e => handleCange(e, index)}
                        />
                    </div>
                ))}
                {images.length === 0 && <p>No images available to include.</p>}
            </div>

            <div className="research-report-filters">
                <h3>Include Filters</h3>
                {research.filters.map((filter, index) => (
                    <div key={index} className="filter-selection">
                        <label>
                            <input
                                type="checkbox"
                                checked={show.filters[index]?.selected}
                                onChange={() => handleToggle(index, 'filters')}
                            />
                            {formatFilterLabel(filter)}
                        </label>
                    </div>
                ))}
                {research.filters.length === 0 && <p>No filters available to include.</p>}
            </div>
            <form className="research-report-form" >

                <div>
                    <label htmlFor="conclusion">Research Conclusion</label>
                    <textarea
                        id="conclusion"
                        value={research.conclusion}
                        onChange={(e) => setResearch({ ...research, conclusion: e.target.value })}
                        placeholder="Enter your research conclusion or findings"
                    />
                </div>

                <div className="checkbox-group">
                    <input
                        type="checkbox"
                        id="hasComparison"
                        checked={research.hasComparison}
                        onChange={(e) => setResearch({ ...research, hasComparison: e.target.checked })}
                    />
                    <label htmlFor="hasComparison">This research includes comparison with other studies</label>
                </div>

                <div className="research-report-actions">
                    <button type="button" className="close-btn" onClick={closeModal}>
                        Cancel
                    </button>

                    {research.name && research.researcherName && research.conclusion && (
                        <PDFDownloadLink
                            document={<ResearchReport research={research} images={images} show={show} />}
                            fileName="research_report.pdf"
                            className="download-link"
                            onClick={(e) => {
                                setTimeout(() => {
                                    e.stopPropagation();
                                    setShowDownload(false);
                                }, 1000);
                            }}
                        >
                            {({ loading }) => (loading ? 'Preparing...' : 'Download Report')}
                        </PDFDownloadLink>
                    )}
                </div>
            </form>
        </Modal>
    );
};
export default MyResearchReport;