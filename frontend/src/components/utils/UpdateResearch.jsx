import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { Column, FormContainer, Row, StyledInput, StyledTextarea } from './StyledComponents-El';


const Button = styled.button`
  margin: 10px 5px;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  background-color: ${(props) => (props.primary ? '#4CAF50' : '#f44336')};
  color: white;
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

export default function UpdateResearch({ research, setResearch, updateResearchs }) {
  const user = useSelector((state) => state.user);
  const [researchData, setResearchData] = useState({
    research_name: research.research_name || '',
    description: research.description || '',
    filters: {
      start_date: research.filters?.start_date || '',
      end_date: research.filters?.end_date || '',
      start_time: research.filters?.start_time || '',
      end_time: research.filters?.end_time || '',
      message_limit: research.filters?.message_limit || '',
      limit_type: research.filters?.limit_type || 'first',
      min_message_length: research.filters?.min_message_length || '',
      max_message_length: research.filters?.max_message_length || '',
      keywords: research.filters?.keywords || '',
      min_messages: research.filters?.min_messages || '',
      max_messages: research.filters?.max_messages || '',
      top_active_users: research.filters?.top_active_users || '',
      selected_users: research.filters?.selected_users || '',
      filter_by_username: research.filters?.filter_by_username || '',
      anonymize: research.filters?.anonymize || false,
      algorithm: research.filters?.algorithm || 'louvain',
    },
  });
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setResearchData((prevData) => {
      if (name in prevData.filters) {
        return {
          ...prevData,
          filters: {
            ...prevData.filters,
            [name]: newValue,
          },
        };
      } else {
        return {
          ...prevData,
          [name]: newValue,
        };
      }
    });
  };

  const handleCancel = () => {
    setResearch(null);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (!file) {
        toast.error('Please upload the file the you used for the research');
        return;
      }
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        toast.error('Error uploading file');
        console.error('Error uploading file:', res);  
        return;
      }
      const response = await fetch(`${import.meta.env.VITE_API_URL}/research/${research.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({...researchData, file_name: file.name}),
      });
      if (response.ok) {
        setResearch(researchData);
        setResearch(null);
        const data = await response.json();
        updateResearchs(data.data);
        toast.success('Research data saved successfully');
      } else {
        toast.error('Error saving research data');
        console.error('Error saving research data:', response);
      }
    } catch (error) {
      toast.error('Error saving research data');
      console.error('Error saving research data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormContainer>
      <h2>Update Research</h2>
      <form>
        <Row>
          <Column fullWidth>
            <label>Research Name:</label>
            <StyledInput
              type="text"
              name="research_name"
              value={researchData.research_name}
              onChange={handleChange}
            />
          </Column>
          <Column fullWidth>
            <label>Description:</label>
            <StyledTextarea
              name="description"
              value={researchData.description}
              onChange={handleChange}
            />
          </Column>
        </Row>
        <Row>
          {Object.keys(researchData.filters).map((key) => (
            <Column key={key}>
              <label>{key.replace(/_/g, ' ')}:</label>
              <StyledInput
                type={key === 'anonymize' ? 'checkbox' : 'text'}
                style={key === 'anonymize' ? { display: 'flex', justifyContent: 'flex-start', marginTop: '10px' } : {}}
                name={key}
                value={researchData.filters[key]}
                checked={key === 'anonymize' ? researchData.filters[key] : undefined}
                onChange={handleChange}
              />
            </Column>
          ))}
          <Column fullWidth>
            <label>File:</label>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          </Column>
        </Row>
        <Button type="button" onClick={handleCancel}>
          Cancel
        </Button>
        <Button type="button" primary onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </form>
    </FormContainer>
  );
}