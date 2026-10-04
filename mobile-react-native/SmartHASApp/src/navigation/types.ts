export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Main: undefined;
  ResourceDetail: { resourceId: string };
  Chat: { resourceId: string; resourceTitle: string; offerantId: string };
  MyLoans: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Chats: undefined;
  Ofertar: undefined;
  Mapa: undefined;
  Perfil: undefined;
};
