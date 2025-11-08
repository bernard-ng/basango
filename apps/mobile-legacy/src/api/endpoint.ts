export const endpoint = {
  feedManagement: {
    addArticleToBookmark: (bookmarkId: string, articleId: string) =>
      `feed/bookmarks/${bookmarkId}/articles/${articleId}`,
    addCommentToArticle: (articleId: string) => `/feed/articles/${articleId}/comments`,
    createBookmark: `/feed/bookmarks`,
    deleteBookmark: (bookmarkId: string) => `/feed/bookmarks/${bookmarkId}`,
    followSource: (sourceId: string) => `/feed/sources/${sourceId}/follow`,
    getArticleCommentList: (articleId: string) => `/feed/articles/${articleId}/comments`,
    getArticleDetails: (articleId: string) => `/feed/articles/${articleId}`,
    getArticleOverviewList: `/feed/articles`,
    getBookmarkedArticlesList: (bookmarkId: string) => `/feed/bookmarks/${bookmarkId}/articles`,
    getBookmarkList: `/feed/bookmarks`,
    getSourceArticleOverviewList: (sourceId: string) => `/feed/sources/${sourceId}/articles`,
    getSourceDetails: (sourceId: string) => `/feed/sources/${sourceId}`,
    getSourceOverviewList: `/feed/sources`,
    removeArticleFromBookmark: (bookmarkId: string, articleId: string) =>
      `/feed/bookmarks/${bookmarkId}/articles/${articleId}`,
    unfollowSource: (sourceId: string) => `/feed/sources/${sourceId}/unfollow`,
    updateBookmark: (bookmarkId: string) => `/feed/bookmarks/${bookmarkId}`,
  },
  identityAndAccess: {
    confirmAccount: (token: string) => `/account/confirm/${token}`,
    getUserProfile: "/me",
    login: "/login_check",
    logout: "/token/invalidate",
    register: "/register",
    requestPassword: "/password/request",
    resetPassword: (token: string) => `/password/reset/${token}`,
    unlockAccount: (token: string) => `/account/unlock/${token}`,
    updatePassword: "/password/update",
  },
};
