import { Page, Text, View, Document, Image } from '@react-pdf/renderer';
import { Fragment } from 'react';
import { styles } from '../../styles/ReportStyle';

const toPlainLatin = s =>
    s.normalize('NFKD')
     .replace(/[\u0300-\u036f]/g, '');

const clean = (text) => {
    if (!text || typeof text !== 'string') return typeof text === 'number' ? text : '';
    let cleanText = text.replace(/(?!(\*|#|\d))[\p{Extended_Pictographic}\p{Emoji_Component}]|[\u0030-\u0039]\ufe0f?[\u20e3]|[\u002A\u0023]?\ufe0f?[\u20e3]/gu, '');
    cleanText = cleanText.includes(',') ? cleanText.split(',').map(toPlainLatin).join(', ') : toPlainLatin(cleanText);
    return cleanText === "" ? 'emoji-removed' : cleanText;
}

export const formatFilterLabel = (filter) => {
    const [key] = filter.split(':');
    if (key.includes(' ')) return key.replace(/^./, c => c.toUpperCase());
    return key.replace(/(?<!^)[A-Z]/g, ' $&').replace(/^./, c => c.toUpperCase());
};

const Report = ({ research, show }) => {
    const mainImages = show.images.filter((image) => image.type === "main" && image.selected);
    const sourceComparisonImages = show.images.filter((image) => image.type === "source" && image.selected);
    let comparisonImages = show.images.filter((image) => image.type === "comparison" && image.selected);
    const groupedComparisonImages = comparisonImages.reduce((acc, image) => {
        const index = image.index;
        if (!acc[index]) {
            acc[index] = [];
        }
        acc[index].push(image);
        return acc;
    }, {});

    const groupedComparisonArray = Object.entries(groupedComparisonImages).map(([_, images]) => ([...images]));
    groupedComparisonArray.sort((a, b) => a.index - b.index);

    const filters = show.filters.filter((filter) => filter.selected).map((filter) => research.filters[filter.index]);

    const getTopNodesByMetric = (nodes, metric, count = 5) => {
        const sortedNodes = [...nodes]
            .sort((a, b) => b[metric] - a[metric])
            .slice(0, count);
        return sortedNodes.map((node) => ({
            ...node,
            name: clean(node.name)
        }));
    };

    const getNetworkStats = () => {
        if (!research.networkData || !research.networkData.nodes || !research.networkData.links) return null;

        const totalNodes = research.networkData.nodes.length;
        const totalLinks = research.networkData.links.length;
        const avgDegree = totalNodes > 0 ? (totalLinks * 2 / totalNodes).toFixed(2) : 0;
        const totalMessages = research.networkData.nodes.reduce((sum, node) => sum + (node.messages || 0), 0);

        return { totalNodes, totalLinks, avgDegree, totalMessages };
    };

    const networkStats = getNetworkStats();

    return (
        <Document>
            <Page style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Research Report</Text>
                </View>
                {mainImages.length > 0 && (
                    <View style={styles.graphSection}>
                        <Text style={styles.graphTitle}>Network Graph Visualization</Text>
                        {mainImages.map((image, index) =>
                            <Fragment key={index}>
                                <Image
                                    style={styles.graphImage}
                                    src={image.data}
                                    alt="Network Graph"
                                />
                                <Text style={styles.imageCaption}>
                                    (Main Graph) {image.description && ` - ${image.description}`}
                                </Text>
                            </Fragment>

                        )}
                    </View>
                )}
                <View style={styles.section} wrap={false}>
                    <Text style={styles.sectionTitle}>Research Information</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Research Name:</Text>
                        <Text style={styles.value}>{research.name}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Researcher:</Text>
                        <Text style={styles.value}>{research.researcherName}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>File:</Text>
                        <Text style={styles.value}>{research.fileName}</Text>
                    </View>
                    <View style={styles.metricHighlight}>
                        <Text style={styles.metricText}>
                            Primary Analysis Metric: {research.metric || 'No specific metric selected'}
                        </Text>
                    </View>
                </View>

                {networkStats !== null && (
                    <View style={styles.section} wrap={false}>
                        <Text style={styles.sectionTitle}>Network Statistics</Text>
                        <View style={styles.row}>
                            <Text style={styles.label}>Total Nodes:</Text>
                            <Text style={styles.value}>{networkStats.totalNodes}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Total Links:</Text>
                            <Text style={styles.value}>{networkStats.totalLinks}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Average Degree:</Text>
                            <Text style={styles.value}>{networkStats.avgDegree}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Total Messages:</Text>
                            <Text style={styles.value}>{networkStats.totalMessages}</Text>
                        </View>
                    </View>
                )}

                {research.networkData?.nodes?.length > 0 && (
                    <View style={styles.section} wrap={false}>
                        <Text style={styles.sectionTitle}>Top Nodes by Centrality Measures</Text>

                        <Text style={[styles.label, { fontSize: 11, marginTop: 10, marginBottom: 5 }]}>
                            Top 5 by Betweenness Centrality:
                        </Text>
                        {getTopNodesByMetric(research.networkData.nodes, 'betweenness').map((node, index) => (
                            <View key={index} style={styles.row}>
                                <Text style={[styles.label, { width: '50%', fontSize: 10 }]}>{node.name}:</Text>
                                <Text style={[styles.value, { width: '50%', fontSize: 10 }]}>{node.betweenness}</Text>
                            </View>
                        ))}

                        <Text style={[styles.label, { fontSize: 11, marginTop: 10, marginBottom: 5 }]}>
                            Top 5 by PageRank:
                        </Text>
                        {getTopNodesByMetric(research.networkData.nodes, 'pagerank').map((node, index) => (
                            <View key={index} style={styles.row}>
                                <Text style={[styles.label, { width: '50%', fontSize: 10 }]}>{node.name}:</Text>
                                <Text style={[styles.value, { width: '50%', fontSize: 10 }]}>{node.pagerank}</Text>
                            </View>
                        ))}

                        <Text style={[styles.label, { fontSize: 11, marginTop: 10, marginBottom: 5 }]}>
                            Top 5 by Message Count:
                        </Text>
                        {getTopNodesByMetric(research.networkData.nodes, 'messages').map((node, index) => (
                            <View key={index} style={styles.row}>
                                <Text style={[styles.label, { width: '50%', fontSize: 10 }]}>{node.name}:</Text>
                                <Text style={[styles.value, { width: '50%', fontSize: 10 }]}>{node.messages} messages</Text>
                            </View>
                        ))}
                    </View>
                )}

                {research.communities.length > 0 && research.communities.length <= 5 && (
                    <View style={styles.section} wrap={false}>
                        <Text style={styles.sectionTitle}>Community Analysis</Text>
                        <View style={styles.row}>
                            <Text style={styles.label}>Total Communities:</Text>
                            <Text style={styles.value}>{research.communities.length}</Text>
                        </View>

                        <View style={styles.comparisonTable} wrap={false}>
                            <View style={[styles.tableRow, { backgroundColor: '#F5F5F5' }]}>
                                <Text style={styles.tableHeader}>Community</Text>
                                <Text style={styles.tableHeader}>Members</Text>
                                <Text style={styles.tableHeader}>Avg Between</Text>
                                <Text style={styles.tableHeader}>Avg PageRank</Text>
                                <Text style={styles.tableHeader}>Avg Messages</Text>
                            </View>
                            {research.communities.slice(0, 10).map((community, index) => (
                                <View key={index} style={styles.tableRow}>
                                    <Text style={styles.tableCell}>{community.id}</Text>
                                    <Text style={styles.tableCell}>{community.size}</Text>
                                    <Text style={styles.tableCell}>{community.avg_betweenness}</Text>
                                    <Text style={styles.tableCell}>{community.avg_pagerank}</Text>
                                    <Text style={styles.tableCell}>{community.avg_messages}</Text>
                                </View>
                            ))}
                        </View>
                        
                        <Text style={[styles.label, { fontSize: 11, marginTop: 15, marginBottom: 5 }]}>
                            Community Members:
                        </Text>
                        {research.communities.slice(0, 10).map((community, index) => (
                            <View key={index} style={[styles.metricHighlight, { marginTop: 5, padding: 8 }]}>
                                <Text style={[styles.label, { fontSize: 10, marginBottom: 3 }]}>
                                    Community {community.id}:
                                </Text>
                                <Text style={[styles.value, { fontSize: 9 }]}>
                                    {clean(community.nodes?.join(', ')) || 'No nodes available'}
                                </Text>
                            </View>
                        ))}
                        
                        {research.communities.length > 10 && (
                            <Text style={[styles.value, { fontSize: 10, marginTop: 5, fontStyle: 'italic' }]}>
                                ... and {research.communities.length - 10} more communities
                            </Text>
                        )}
                    </View>
                )}

                {filters.length > 0 && <View style={styles.section} wrap={false}>
                    <Text style={styles.sectionTitle}>Applied Filters</Text>
                    <View style={styles.filtersContainer}>
                        {filters.map((filter, index) => (
                            <Text key={index} style={styles.filterItem}>
                                {`${formatFilterLabel(filter)}: ${filter.split(':')[1].trim()}`}
                            </Text>
                        ))}
                    </View>
                </View>}

                <View style={styles.section} wrap={false}>
                    <Text style={styles.sectionTitle}>Research Conclusion</Text>
                    <Text style={styles.conclusion}>{research.conclusion || research.review}</Text>
                </View>

                {research.hasComparison && (
                    <View style={styles.comparison}>
                        <Text>This research includes {research.stats.length} comparison studies.</Text>
                    </View>
                )}
            </Page>

            {research.communities.length > 5 && (
                <>
                    <Page key="communities" style={styles.page}>
                        <Text style={styles.sectionTitle}>Community Analysis</Text>
                        <View style={styles.row}>
                            <Text style={styles.label}>Total Communities:</Text>
                            <Text style={styles.value}>{research.communities.length}</Text>
                        </View>

                        <View style={styles.comparisonTable} wrap={false}>
                            <View style={[styles.tableRow, { backgroundColor: '#F5F5F5' }]}>
                                <Text style={styles.tableHeader}>Community</Text>
                                <Text style={styles.tableHeader}>Members</Text>
                                <Text style={styles.tableHeader}>Avg Between</Text>
                                <Text style={styles.tableHeader}>Avg PageRank</Text>
                                <Text style={styles.tableHeader}>Avg Messages</Text>
                            </View>
                            {research.communities.slice(0, 15).map((community, index) => (
                                <View key={index} style={styles.tableRow}>
                                    <Text style={styles.tableCell}>{community.id}</Text>
                                    <Text style={styles.tableCell}>{community.size}</Text>
                                    <Text style={styles.tableCell}>{community.avg_betweenness}</Text>
                                    <Text style={styles.tableCell}>{community.avg_pagerank}</Text>
                                    <Text style={styles.tableCell}>{community.avg_messages}</Text>
                                </View>
                            ))}
                        </View>
                    </Page>

                    <Page key="communities-members" style={styles.page}>
                        <Text style={[styles.label, { fontSize: 11, marginTop: 15, marginBottom: 5 }]}>
                            Community Members:
                        </Text>
                        {research.communities.slice(0, 9).map((community, index) => {
                            const communityMembers = clean(community.nodes?.slice(0, 10).join(', ')) || 'No nodes available';
                            return (
                            <View key={index} style={[styles.metricHighlight, { marginTop: 5, padding: 8 }]}>
                                <Text style={[styles.label, { fontSize: 10, marginBottom: 3 }]}>
                                    Community {community.id}:
                                </Text>
                                <Text style={[styles.value, { fontSize: 9 }]}>
                                    {community.nodes?.length > 10 ? `${communityMembers} and ${community.nodes?.length - 10} more nodes` : communityMembers }
                                </Text>
                            </View>
                        )})}
                        
                        {research.communities.length > 10 && (
                            <Text style={[styles.value, { fontSize: 10, marginTop: 5, fontStyle: 'italic' }]}>
                                ... and {research.communities.length - 10} more communities
                            </Text>
                        )}
                    </Page>
                </>
            )}

            {research.hasComparison ? (
                <>
                    {sourceComparisonImages.length > 1 && (
                        <Page key="source-comparison" style={styles.page}>
                            <Text style={styles.pageNumber}>Source Comparison Images</Text>
                            <View style={styles.comparisonSection}>
                                <View style={styles.comparisonImagesContainer}>
                                    {sourceComparisonImages.map((data, index) => (
                                        <View key={index} style={styles.comparisonImageContainer} wrap={false}>
                                            {data.width === "big" ?
                                                <Image
                                                    style={[styles.bigSourceImage, { marginTop: 20 }]}
                                                    src={data.data}
                                                />
                                                :
                                                <Image
                                                    style={styles.comparisonImage}
                                                    src={data.data}
                                                />
                                            }
                                            <Text style={styles.imageCaption}>(Source Graph) {data.description && `- ${data.description}`}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </Page>
                    )}

                    {comparisonImages.length > 0 &&
                        groupedComparisonArray.map((data, index) => {
                            const comparisonStats = research.stats.find(
                                (state) => state.index === data[0].index
                            );
                            const comparisonFile = research.comparisonFiles[index]
                            const getFileName = (file) => {
                                if (!file) return 'unknown';
                                if (typeof file === 'string') return file;
                                if (file && typeof file === 'object' && file.name) return file.name;
                                return 'unknown';
                            };
                            return (
                                <Page key={`comparison-${index}`} style={styles.page}>
                                    <Text style={styles.pageNumber}>Comparison Image {index + 1}</Text>

                                    <View style={styles.comparisonSection}>
                                        <Text style={styles.comparisonTitle}>
                                            source: {research?.fileName}. comparison: {getFileName(comparisonFile)}.
                                        </Text>
                                        <View style={styles.comparisonImagesContainer}>
                                            {sourceComparisonImages.length === 1 &&
                                                <>
                                                    {sourceComparisonImages[0].width === "small" ?
                                                        <View style={styles.comparisonImageContainer} wrap={false}>
                                                            <Image
                                                                style={styles.comparisonImage}
                                                                src={sourceComparisonImages[0]?.data}
                                                            />
                                                                <Text style={styles.imageCaption}>
                                                                    (Source Graph) {sourceComparisonImages[0]?.description && `- ${sourceComparisonImages[0]?.description}`}
                                                                </Text>
                                                        </View>
                                                        :
                                                        <>
                                                            <View style={styles.comparisonImageContainer} wrap={false}>
                                                                <Image
                                                                    style={styles.bigSourceImage}
                                                                    src={sourceComparisonImages[0]?.data}
                                                                />
                                                                <Text style={styles.imageCaption}>
                                                                    (Source Graph) {sourceComparisonImages[0]?.description && `- ${sourceComparisonImages[0]?.description}`}
                                                                </Text>
                                                            </View>
                                                        </>}
                                                </>
                                            }
                                            {data.map((image, index) => (
                                                <View key={index} style={styles.comparisonImageContainer} wrap={false}>
                                                    <Image
                                                        style={styles.comparisonImage}
                                                        src={image.data}
                                                    />
                                                    <Text style={styles.imageCaption}>(Comparison Graph) {image.description && `- ${image.description}`}</Text>
                                                </View>
                                            ))}
                                        </View>

                                        <View style={styles.comparisonTable} wrap={false}>
                                            <View style={[styles.tableRow, { backgroundColor: '#F5F5F5' }]}>
                                                <Text style={styles.tableHeader}>Metric</Text>
                                                <Text style={styles.tableHeader}>Original</Text>
                                                <Text style={styles.tableHeader}>Comparison</Text>
                                                <Text style={styles.tableHeader}>Difference</Text>
                                                <Text style={styles.tableHeader}>Change %</Text>
                                            </View>

                                            <View style={styles.tableRow}>
                                                <Text style={styles.tableCell}>Node Count</Text>
                                                <Text style={styles.tableCell}>
                                                    {comparisonStats?.originalNodeCount}
                                                </Text>
                                                <Text style={styles.tableCell}>
                                                    {comparisonStats?.comparisonNodeCount}
                                                </Text>
                                                <Text style={styles.tableCell}>
                                                    {(comparisonStats?.nodeDifference > 0
                                                        ? `+${comparisonStats.nodeDifference}`
                                                        : comparisonStats?.nodeDifference) || ''}
                                                </Text>
                                                <Text style={styles.tableCell}>
                                                    {`${comparisonStats?.nodeChangePercent || ''}${comparisonStats?.nodeChangePercent ? '%' : ''}`}
                                                </Text>
                                            </View>

                                            <View style={styles.tableRow}>
                                                <Text style={styles.tableCell}>Edge Count</Text>
                                                <Text style={styles.tableCell}>
                                                    {comparisonStats?.originalLinkCount}
                                                </Text>
                                                <Text style={styles.tableCell}>
                                                    {comparisonStats?.comparisonLinkCount}
                                                </Text>
                                                <Text style={styles.tableCell}>
                                                    {(comparisonStats?.linkDifference > 0
                                                        ? `+${comparisonStats.linkDifference}`
                                                        : comparisonStats?.linkDifference) || ''}
                                                </Text>
                                                <Text style={styles.tableCell}>
                                                    {`${comparisonStats?.linkChangePercent || ''}${comparisonStats?.linkChangePercent ? '%' : ''}`}
                                                </Text>
                                            </View>

                                            <View style={styles.tableRow}>
                                                <Text style={styles.tableCell}>Common Nodes</Text>
                                                <Text style={[styles.tableCell, { width: '40%' }]}>
                                                    {comparisonStats?.commonNodesCount}
                                                </Text>
                                                <Text style={[styles.tableCell, { width: '40%' }]}>
                                                    {(
                                                        (comparisonStats?.commonNodesCount /
                                                            comparisonStats?.originalNodeCount) *
                                                        100
                                                    ).toFixed(2)}
                                                    % of original network
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.section} wrap={false}>
                                            <Text style={styles.sectionTitle}>Applied Filters (comparison #{index + 1})</Text>
                                            <View style={styles.filtersContainer}>
                                                {show.comparisonFilters[index] && Object.entries(show.comparisonFilters[index])
                                                    .map(([key, value], filterIndex) => (
                                                        <Text key={filterIndex} style={styles.filterItem}>
                                                            {formatFilterLabel(key) + ': ' + (value || 'false')}
                                                        </Text>
                                                    ))}
                                            </View>
                                        </View>
                                    </View>
                                    <View style={styles.footer} fixed>
                                        <Text>
                                            Generated on {new Date().toLocaleDateString()} - Network Analysis
                                            Platform
                                        </Text>
                                    </View>
                                </Page>
                            );
                        })}
                </>
            ) : null}
        </Document>
    )
};

export default Report;