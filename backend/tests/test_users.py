# backend/tests/test_users.py
import pytest


def test_get_all_users(client, test_user):
    response = client.get("/users")
    assert response.status_code == 200
    users = response.json()
    assert isinstance(users, list)
    assert len(users) >= 1

    # Check if test user is in the list
    user_emails = [user["email"] for user in users]
    assert test_user["email"] in user_emails


def test_update_user(client, test_user):
    # First login to get token
    login_response = client.post(
        "/login",
        json={"email": test_user["email"], "password": test_user["password"]}
    )
    token = login_response.json()["access_token"]

    # Update user
    update_response = client.put(
        f"/users/{test_user['id']}",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Updated Name"}
    )

    assert update_response.status_code == 200
    updated_user = update_response.json()
    assert updated_user["name"] == "Updated Name"
    assert updated_user["email"] == test_user["email"]


def test_delete_user(client, test_user):
    # First login to get token
    login_response = client.post(
        "/login",
        json={"email": test_user["email"], "password": test_user["password"]}
    )
    token = login_response.json()["access_token"]

    # Delete user
    delete_response = client.delete(
        f"/users/{test_user['id']}",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert delete_response.status_code == 200
    assert "message" in delete_response.json()
    assert "deleted successfully" in delete_response.json()["message"]