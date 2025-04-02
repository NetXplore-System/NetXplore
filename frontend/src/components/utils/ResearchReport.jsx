import { Page, Text, View, Document, StyleSheet, PDFDownloadLink, Font, Image } from '@react-pdf/renderer';
import { useState, useEffect } from 'react';
import './style.css';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import MetricsButton from '../common/MetricsButton';
import html2canvas from 'html2canvas';

Font.register({
    family: 'Roboto',
    src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf',
});

// Define styles with improved aesthetics
const styles = StyleSheet.create({
    page: {
        padding: 40,
        backgroundColor: '#FCFCFC',
        fontFamily: 'Roboto',
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
        marginBottom: 10,
        textAlign: 'center',
    },
    graphImage: {
        width: '100%',
        height: 300,
        borderRadius: 4,
        marginTop: 10,
        border: '1px solid #EEE',
    },
    comparisonImage: {
        width: '45%',
        height: 200,
        marginHorizontal: 10,
        borderRadius: 4,
        border: '1px solid #EEE',
    },
    comparisonImagesContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: 10,
    },
    comparisonTable: {
        width: '100%',
        marginTop: 15,
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
});

// Create Document Component
const ResearchReport = ({ research }) => {
    const canvas = document.querySelectorAll('canvas');

    return (
        <Document>
            <Page style={styles.page}>
                {/* Header Section */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Research Report</Text>
                </View>
                {canvas?.[0] && (
                    <View style={styles.graphSection}>
                        <Text style={styles.graphTitle}>Network Graph Visualization</Text>
                        <Image
                            style={styles.graphImage}
                            src={canvas[0].toDataURL('image/png')}
                        />
                        <Text style={styles.imageCaption}>
                            Fig. 1: Visual representation of the analyzed network structure
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

                {/* Filters Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Applied Filters</Text>
                    <View style={styles.filtersContainer}>
                        {research.filters.map((filter, index) => (
                            <Text key={index} style={styles.filterItem}>
                                {filter}
                            </Text>
                        ))}
                    </View>
                </View>

                {/* Conclusion Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Research Conclusion</Text>
                    <Text style={styles.conclusion}>{research.conclusion || research.review}</Text>
                </View>

                {research.hasComparison && (
                    <View style={styles.comparison}>
                        <Text>This research includes {research.stats.length} comparison studies.</Text>
                    </View>
                )}
            </Page>
            {research.hasComparison && research.stats.map((comparisonStats, index) => (
                <Page key={index} style={styles.page}>
                    <Text style={styles.pageNumber}>Page {index + 2}</Text>


                    <View key={index} style={styles.comparisonSection}>
                        <Text style={styles.comparisonTitle}>
                            Comparison #{index + 1} Page: {comparisonStats.fileName}
                        </Text>

                        <View style={[styles.comparisonImagesContainer, { height: '45%' }]}>
                            <Image
                                style={[styles.comparisonImage, { height: '100%' }]}
                                src={canvas[1].toDataURL("image/png")}
                            />
                            <Image
                                style={[styles.comparisonImage, { height: '100%' }]}
                                src={canvas[index + 2].toDataURL("image/png")}
                            />
                        </View>

                        <View style={[styles.comparisonTable, { height: '45%' }]}>
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
            ))}

        </Document>
    )
};





const MyResearchReport = ({ selectedMetric, name, params, setShowDownload, hasComparison }) => {
    const { user, table } = useSelector((state) => state);
    const { currentUser } = user;
    const [research, setResearch] = useState({
        name: name || 'unknown',
        researcherName: currentUser?.name || 'unknown',
        date: new Date().toISOString().split('T')[0],
        filters: params ? Array.from(params).map(([key, value]) => `${key}: ${value}`) : [],
        conclusion: '',
        hasComparison,
        metric: selectedMetric,
        stats: table.tableData || [],
    });

    console.log(table.tableData, 'tableData');


    const handleSubmit = (e) => {
        e.preventDefault();
        if (!research.name || !research.researcherName || !research.conclusion) {
            toast.error("Please fill in all required fields.");
            return;
        }
    };

    return (
        <div className="research-report-container">
            <div className="research-report-header">
                <h2>Research Report</h2>
                <button className="close-btn" onClick={() => setShowDownload(false)}>×</button>
            </div>

            <div className="research-report-info">
                <h3>Research Information</h3>
                <p>Research Name: {research.name}</p>
                <p>Researcher Name: {research.researcherName}</p>
            </div>

            <form className="research-report-form" onSubmit={handleSubmit}>

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
                    <button type="button" className="close-btn" onClick={() => setShowDownload(false)}>
                        Cancel
                    </button>

                    {research.name && research.researcherName && research.conclusion && (
                        <PDFDownloadLink
                            document={<ResearchReport research={research} />}
                            fileName="research_report.pdf"
                            className="download-link"
                        >
                            {({ loading }) => (loading ? 'Preparing...' : 'Download Report')}
                        </PDFDownloadLink>
                    )}
                </div>
            </form>
        </div>
    );
};
export default MyResearchReport;