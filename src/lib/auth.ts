export function authenticate(email: string, password: string): boolean {
    const users = [
      { email: process.env.NEXT_PUBLIC_USER_1_EMAIL, password: process.env.NEXT_PUBLIC_USER_1_PASSWORD },
    ];
    return users.some(user => user.email === email && user.password === password);
  }
  