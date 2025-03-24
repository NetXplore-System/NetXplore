# /home/sdg/Alpha/backend/tests/test_auth.py
def test_register_success(client):
    """Test user registration."""
    response = client.post(
        "/register",
        json={"name": "New User", "email": "newuser@example.com", "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["name"] == "New User"
    assert data["email"] == "newuser@example.com"