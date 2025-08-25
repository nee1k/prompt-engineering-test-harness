def test_root(client):
    resp = client.get("/")
    assert resp.status_code == 200
    assert "message" in resp.json()


def test_redis_health(client):
    resp = client.get("/health/redis/")
    assert resp.status_code == 200
    body = resp.json()
    assert "status" in body

