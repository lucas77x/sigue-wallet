import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/models/user.js', () => ({
  findUserById: vi.fn(),
}));

import { loadUser, requireAuth } from '../../src/middleware/auth.js';
import { findUserById } from '../../src/models/user.js';

function makeRequest(overrides = {}) {
  return {
    session: { userId: null, destroy: vi.fn() },
    user: undefined,
    ...overrides,
  };
}

function makeReply() {
  return {
    redirect: vi.fn(),
    status: vi.fn().mockReturnThis(),
    send: vi.fn(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('loadUser', () => {
  it('does nothing when session has no userId', async () => {
    const request = makeRequest({ session: { userId: null, destroy: vi.fn() } });
    await loadUser(request);
    expect(findUserById).not.toHaveBeenCalled();
    expect(request.user).toBeUndefined();
  });

  it('sets request.user with id and username when user is found', async () => {
    findUserById.mockResolvedValue({ id: 1, username: 'alice', password_hash: 'secret' });
    const request = makeRequest({ session: { userId: 1, destroy: vi.fn() } });

    await loadUser(request);

    expect(findUserById).toHaveBeenCalledWith(1);
    expect(request.user).toEqual({ id: 1, username: 'alice' });
  });

  it('does NOT expose password_hash on request.user', async () => {
    findUserById.mockResolvedValue({ id: 1, username: 'alice', password_hash: 'supersecret' });
    const request = makeRequest({ session: { userId: 1, destroy: vi.fn() } });

    await loadUser(request);

    expect(request.user.password_hash).toBeUndefined();
  });

  it('destroys session when user is not found (stale session)', async () => {
    findUserById.mockResolvedValue(undefined);
    const destroyFn = vi.fn();
    const request = makeRequest({ session: { userId: 42, destroy: destroyFn } });

    await loadUser(request);

    expect(destroyFn).toHaveBeenCalled();
    expect(request.user).toBeUndefined();
  });
});

describe('requireAuth', () => {
  it('redirects to /login when session has no userId', async () => {
    const request = makeRequest({ session: { userId: null } });
    const reply = makeReply();

    await requireAuth(request, reply);

    expect(reply.redirect).toHaveBeenCalledWith('/login');
  });

  it('does nothing (passes through) when session has a userId', async () => {
    const request = makeRequest({ session: { userId: 1 } });
    const reply = makeReply();

    const result = await requireAuth(request, reply);

    expect(reply.redirect).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });
});
