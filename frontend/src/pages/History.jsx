import styled from 'styled-components';
import { useState, useEffect} from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import Loader from '../components/utils/Loader';
import { FaEye, FaEdit, FaCopy, FaTrash } from 'react-icons/fa';
import Modal from '../components/utils/Modal';
import ResearchHistory from '../components/utils/ResearcHistory';
import UpdateResearch from '../components/utils/UpdateResearch';
import ComparisonHistory from '../components/utils/HistoryComparison';
import { Button, ButtonContainer, ContainerLoader, HistoryContainer, StatusBadge, Table } from '../components/utils/StyledComponents-El';



const History = () => {
    const user = useSelector(state => state.user);
    const [userHistory, setUserHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [research, setResearch] = useState(null);
    const [inAction, setInAction] = useState(false);

    const handleDelete = async (researchId) => {
        try {
            setInAction(true);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/research/${researchId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${user?.token}`
                }
            });
            if (response.ok) {
                toast.success('Research deleted successfully');
                setUserHistory(userHistory.filter(research => research.id !== researchId));
            } else {
                toast.error('Failed to delete research');
            }
        } catch (error) {
            console.error('Error deleting research:', error);
            toast.error('Error deleting research');
        } finally {
            setInAction(false);
        }
    };

    const updateResearchs = (researchData) => {
        setUserHistory(userHistory.map(research => research.id === researchData.id ? {...research, ...researchData} : research));
    };

    useEffect(() => {
        async function getUserHistory() {
            try {
                setLoading(true);
                const history = await fetch(`${import.meta.env.VITE_API_URL}/history/${user?.currentUser?.id}`, {
                    headers: {
                        'Authorization': `Bearer ${user?.token}`
                    }
                });
                const data = await history.json();
                setUserHistory(data.history);
                toast.success('User history fetched successfully');
            } catch (error) {
                console.error('Error fetching user history:', error);
                toast.error('Error fetching user history');
            } finally {
                setLoading(false);
            }
        }
        getUserHistory();
    }, []);

    return (
        <HistoryContainer>
            {research && (
                <Modal onClose={() => setResearch(null)}>
                    {research.button === 'view' && <ResearchHistory research={research} />}
                    {research.button === 'edit' && <UpdateResearch research={research} setResearch={setResearch} updateResearchs={updateResearchs}/>}
                    {research.button === 'compare' && <ComparisonHistory research={research} />}
                </Modal>
            )}
            <h2>{user?.currentUser?.name || 'User'} History</h2>
            {loading ? (
                <ContainerLoader>
                    <Loader />
                </ContainerLoader>
            ) : (
                <Table>
                    <thead>
                        <tr>
                            <th>Research Name</th>
                            <th>Date Created</th>
                            <th>Platform</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {userHistory.map((research) => (
                            <tr key={research.id}>
                                <td>{research.research_name}</td>
                                <td>{new Date(research.created_at).toLocaleDateString()}</td>
                                <td>{research.platform}</td>
                                <td>
                                    <StatusBadge status={research.status}>
                                        {research.status || 'N/A'}
                                    </StatusBadge>
                                </td>
                                <td>
                                    <ButtonContainer>
                                        <Button variant="primary" aria-label="View details" onClick={() => setResearch({...research, button: 'view'})}>
                                            <FaEye />
                                        </Button>
                                        <Button variant="success" onClick={() => setResearch({...research, button: 'edit'})} aria-label="Edit">
                                            <FaEdit />
                                        </Button>
                                        <Button variant="warning" onClick={() => setResearch({...research, button: 'compare'})} aria-label="Compare">
                                            <FaCopy />
                                        </Button>
                                        <Button variant="danger" onClick={() => handleDelete(research.id)} aria-label="Delete" disabled={inAction}>
                                            <FaTrash />
                                        </Button>
                                    </ButtonContainer>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </HistoryContainer>
    );
};

export default History;