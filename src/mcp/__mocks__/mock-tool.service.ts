import { Injectable } from '@nestjs/common';
import { McpTool } from '../decorators';
import * as z from 'zod/v4';

export interface MockUser {
  id: number;
  name: string;
  email: string;
}

@Injectable()
export class MockToolService {
  private mockUsers: MockUser[] = [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' },
    { id: 3, name: 'Charlie', email: 'charlie@example.com' },
  ];

  @McpTool({
    name: 'list_mock_users',
    title: 'List Mock Users',
    description: 'Returns a list of all mock users',
    inputSchema: z.object({}),
  })
  getAllUsers(): MockUser[] {
    return this.mockUsers;
  }

  @McpTool({
    name: 'get_mock_user',
    title: 'Get Mock User',
    description: 'Get a specific mock user by ID',
    inputSchema: z.object({
      id: z.number().describe('User ID'),
    }),
  })
  getUserById(id: number): MockUser | undefined {
    return this.mockUsers.find((user) => user.id === id);
  }

  @McpTool({
    name: 'create_mock_user',
    title: 'Create Mock User',
    description: 'Create a new mock user',
    inputSchema: z.object({
      name: z.string().describe('User name'),
      email: z.string().email().describe('User email'),
    }),
  })
  createUser(args: { name: string; email: string }): MockUser {
    const newUser: MockUser = {
      id: this.mockUsers.length + 1,
      name: args.name,
      email: args.email,
    };
    this.mockUsers.push(newUser);
    return newUser;
  }

  @McpTool({
    name: 'search_mock_users',
    title: 'Search Mock Users',
    description: 'Search users by name (case-insensitive)',
    inputSchema: z.object({
      query: z.string().describe('Search query'),
    }),
  })
  searchUsers(query: string): MockUser[] {
    return this.mockUsers.filter((user) =>
      user.name.toLowerCase().includes(query.toLowerCase()),
    );
  }

  @McpTool({
    name: 'get_mock_user_stats',
    title: 'Get Mock User Statistics',
    description: 'Get statistics about mock users',
    inputSchema: z.object({}),
  })
  getUserStats() {
    return {
      total: this.mockUsers.length,
      domains: [
        ...new Set(this.mockUsers.map((u) => u.email.split('@')[1])),
      ],
      averageNameLength:
        this.mockUsers.reduce((sum, u) => sum + u.name.length, 0) /
        this.mockUsers.length,
    };
  }

  // Non-decorated method (should NOT be registered as a tool)
  resetUsers(): void {
    this.mockUsers = [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' },
      { id: 3, name: 'Charlie', email: 'charlie@example.com' },
    ];
  }
}
