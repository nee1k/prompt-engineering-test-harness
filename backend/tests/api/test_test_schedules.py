def test_list_test_schedules_empty(client):
    resp = client.get("/test-schedules/")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_toggle_404(client):
    resp = client.put("/test-schedules/not-found/toggle")
    assert resp.status_code == 404

