export type UserLookupDto = {
  id: string;
  name: string;
  email: string;
};

export type UserLookupResponse = {
  user: UserLookupDto | null;
};
