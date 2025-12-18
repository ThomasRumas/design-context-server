import { Test, TestingModule } from '@nestjs/testing';
import { MockToolService } from './mock-tool.service';

describe('MockToolService', () => {
  let service: MockToolService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MockToolService],
    }).compile();

    service = module.get<MockToolService>(MockToolService);
    service.resetUsers(); // Reset to default state
  });

  describe('getAllUsers', () => {
    it('should return all mock users', () => {
      const users = service.getAllUsers();
      expect(users).toHaveLength(3);
      expect(users[0]).toHaveProperty('id');
      expect(users[0]).toHaveProperty('name');
      expect(users[0]).toHaveProperty('email');
    });

    it('should work with object argument (MCP format)', () => {
      const users = service.getAllUsers();
      expect(users).toBeDefined();
      expect(Array.isArray(users)).toBe(true);
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', () => {
      const user = service.getUserById(1);
      expect(user).toBeDefined();
      expect(user?.name).toBe('Alice');
    });

    it('should return another user by ID', () => {
      const user = service.getUserById(2);
      expect(user).toBeDefined();
      expect(user?.name).toBe('Bob');
    });

    it('should return undefined for non-existent ID', () => {
      const user = service.getUserById(999);
      expect(user).toBeUndefined();
    });
  });

  describe('createUser', () => {
    it('should create a new user', () => {
      const newUser = service.createUser({
        name: 'Dave',
        email: 'dave@example.com',
      });

      expect(newUser).toBeDefined();
      expect(newUser.id).toBe(4);
      expect(newUser.name).toBe('Dave');
      expect(newUser.email).toBe('dave@example.com');

      const allUsers = service.getAllUsers();
      expect(allUsers).toHaveLength(4);
    });

    it('should increment IDs correctly', () => {
      const user1 = service.createUser({
        name: 'User1',
        email: 'user1@test.com',
      });
      const user2 = service.createUser({
        name: 'User2',
        email: 'user2@test.com',
      });

      expect(user2.id).toBe(user1.id + 1);
    });
  });

  describe('searchUsers', () => {
    it('should search users by name', () => {
      const results = service.searchUsers('alice');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Alice');
    });

    it('should search other users by name', () => {
      const results = service.searchUsers('bob');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Bob');
    });

    it('should be case-insensitive', () => {
      const resultsLower = service.searchUsers('alice');
      const resultsUpper = service.searchUsers('ALICE');
      const resultsMixed = service.searchUsers('AlIcE');

      expect(resultsLower).toHaveLength(1);
      expect(resultsUpper).toHaveLength(1);
      expect(resultsMixed).toHaveLength(1);
    });

    it('should return empty array when no matches', () => {
      const results = service.searchUsers('nonexistent');
      expect(results).toHaveLength(0);
    });

    it('should return partial matches', () => {
      const results = service.searchUsers('a');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', () => {
      const stats = service.getUserStats();

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('domains');
      expect(stats).toHaveProperty('averageNameLength');

      expect(stats.total).toBe(3);
      expect(Array.isArray(stats.domains)).toBe(true);
      expect(typeof stats.averageNameLength).toBe('number');
    });

    it('should calculate correct statistics', () => {
      const stats = service.getUserStats();
      const users = service.getAllUsers();

      expect(stats.total).toBe(users.length);

      const expectedAvgLength =
        users.reduce((sum, u) => sum + u.name.length, 0) / users.length;
      expect(stats.averageNameLength).toBeCloseTo(expectedAvgLength);
    });

    it('should extract unique domains', () => {
      const stats = service.getUserStats();
      expect(stats.domains).toContain('example.com');
      expect(stats.domains.length).toBeGreaterThan(0);
    });
  });

  describe('resetUsers', () => {
    it('should reset users to initial state', () => {
      service.createUser({ name: 'New User', email: 'new@test.com' });
      expect(service.getAllUsers()).toHaveLength(4);

      service.resetUsers();
      expect(service.getAllUsers()).toHaveLength(3);
      expect(service.getAllUsers()[0].name).toBe('Alice');
    });
  });

  describe('MCP Tool Decorator Integration', () => {
    it('should have metadata for decorated methods', () => {
      const prototype = Object.getPrototypeOf(service);
      const metadata = Reflect.getMetadata('mcp:tool', prototype.constructor);

      expect(metadata).toBeDefined();
      expect(Array.isArray(metadata)).toBe(true);
      expect(metadata.length).toBeGreaterThan(0);
    });

    it('should have correct tool names in metadata', () => {
      const prototype = Object.getPrototypeOf(service);
      const metadata = Reflect.getMetadata('mcp:tool', prototype.constructor);

      const toolNames = metadata.map((m: any) => m.name);
      expect(toolNames).toContain('list_mock_users');
      expect(toolNames).toContain('get_mock_user');
      expect(toolNames).toContain('create_mock_user');
      expect(toolNames).toContain('search_mock_users');
      expect(toolNames).toContain('get_mock_user_stats');
    });

    it('should not include non-decorated methods', () => {
      const prototype = Object.getPrototypeOf(service);
      const metadata = Reflect.getMetadata('mcp:tool', prototype.constructor);

      const methodNames = metadata.map((m: any) => m.methodName);
      expect(methodNames).not.toContain('resetUsers');
    });
  });
});
