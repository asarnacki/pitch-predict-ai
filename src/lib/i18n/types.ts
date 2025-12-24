export type Language = "pl" | "en";

export interface Translation {
  // Common
  common: {
    appName: string;
    loading: string;
    error: string;
    retry: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    close: string;
  };

  // Navigation
  nav: {
    home: string;
    predictions: string;
    login: string;
    register: string;
    logout: string;
    profile: string;
  };

  // Auth
  auth: {
    login: {
      title: string;
      email: string;
      password: string;
      submit: string;
      forgotPassword: string;
      noAccount: string;
      registerLink: string;
      processing: string;
    };
    register: {
      title: string;
      email: string;
      password: string;
      confirmPassword: string;
      submit: string;
      hasAccount: string;
      loginLink: string;
      processing: string;
    };
    resetPassword: {
      title: string;
      description: string;
      email: string;
      submit: string;
      rememberPassword: string;
      loginLink: string;
      processing: string;
    };
    updatePassword: {
      title: string;
      description: string;
      password: string;
      confirmPassword: string;
      submit: string;
      processing: string;
    };
  };

  // Predictions
  predictions: {
    title: string;
    subtitle: string;
    generatePrediction: string;
    savePrediction: string;
    noMatches: string;
    noMatchesDescription: string;
    errorTitle: string;
    errorDescription: string;
    retryButton: string;
    savedPredictions: string;
    myPredictions: string;
  };

  // Match
  match: {
    homeTeam: string;
    awayTeam: string;
    date: string;
    time: string;
    prediction: string;
    probability: string;
    analysis: string;
  };

  // League
  league: {
    selectLeague: string;
    premierLeague: string;
    laLiga: string;
    bundesliga: string;
    serieA: string;
    ligue1: string;
  };
}
