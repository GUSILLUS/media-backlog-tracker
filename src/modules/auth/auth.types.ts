type RegisterUserPayload = {
  email: string;
  password: string;
  name: string;
  avatarUrl?: string;
};

type LoginUserPayload = {
  email: string;
  password: string;
};

export type { RegisterUserPayload, LoginUserPayload };