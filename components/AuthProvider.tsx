
  "use client";

  import {
    createContext,
    useContext,
    useEffect,
    useState,
  } from "react";

  import type {
    Session,
    User,
  } from "@supabase/supabase-js";

  import { supabase } from "@/lib/supabase";

  type AuthContextType = {
    user: User | null;
    session: Session | null;
    loading: boolean;

    signUp: (
      email: string,
      password: string
    ) => Promise<{
      user: User | null;
      session: Session | null;
      error: string | null;
    }>;

    signIn: (
      email: string,
      password: string
    ) => Promise<{
      user: User | null;
      session: Session | null;
      error: string | null;
    }>;

    signOut: () => Promise<{
      error: string | null;
    }>;

    refreshSession: () => Promise<void>;
  };

  const AuthContext =
    createContext<AuthContextType | null>(null);

  /**
   * 將 Supabase 錯誤轉換成使用者看得懂的中文
   */
  function getAuthErrorMessage(
    error: unknown
  ): string {
    if (
      error &&
      typeof error === "object" &&
      "message" in error
    ) {
      const message = String(
        (error as { message?: unknown })
          .message ?? ""
      );

      const lowerMessage =
        message.toLowerCase();

      if (
        lowerMessage.includes(
          "invalid login credentials"
        )
      ) {
        return "Email 或密碼錯誤";
      }

      if (
        lowerMessage.includes(
          "email not confirmed"
        )
      ) {
        return "Email 尚未完成驗證";
      }

      if (
        lowerMessage.includes(
          "user already registered"
        )
      ) {
        return "此 Email 已經註冊";
      }

      if (
        lowerMessage.includes(
          "password should be at least"
        )
      ) {
        return "密碼長度不足";
      }

      if (
        lowerMessage.includes(
          "unable to validate email address"
        )
      ) {
        return "Email 格式不正確";
      }

      if (
        lowerMessage.includes(
          "email address"
        ) &&
        lowerMessage.includes(
          "invalid"
        )
      ) {
        return "Email 格式不正確";
      }

      if (message) {
        return message;
      }
    }

    return "發生未知錯誤，請稍後再試";
  }

  export function AuthProvider({
    children,
  }: {
    children: React.ReactNode;
  }) {
    const [user, setUser] =
      useState<User | null>(null);

    const [session, setSession] =
      useState<Session | null>(null);

    const [loading, setLoading] =
      useState(true);

    /**
     * 初始化 Session
     */
    useEffect(() => {
      let mounted = true;

      async function initializeAuth() {
        try {
          const {
            data,
            error,
          } = await supabase.auth.getSession();

          if (error) {
            console.error(
              "取得登入 Session 失敗:",
              error
            );

            if (mounted) {
              setSession(null);
              setUser(null);
            }

            return;
          }

          if (!mounted) {
            return;
          }

          setSession(data.session);
          setUser(
            data.session?.user ?? null
          );
        } catch (error) {
          console.error(
            "初始化 Auth 發生錯誤:",
            error
          );

          if (mounted) {
            setSession(null);
            setUser(null);
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      }

      initializeAuth();

      /**
       * 監聽登入狀態
       */
      const {
        data: authListener,
      } =
        supabase.auth.onAuthStateChange(
          (_event, nextSession) => {
            if (!mounted) {
              return;
            }

            setSession(nextSession);
            setUser(
              nextSession?.user ?? null
            );
          }
        );

      return () => {
        mounted = false;

        authListener.subscription.unsubscribe();
      };
    }, []);

    /**
     * 註冊
     */
    const signUp = async (
      email: string,
      password: string
    ): Promise<{
      user: User | null;
      session: Session | null;
      error: string | null;
    }> => {
      try {
        const normalizedEmail =
          email.trim().toLowerCase();

        if (!normalizedEmail) {
          return {
            user: null,
            session: null,
            error: "請輸入 Email",
          };
        }

        if (!password) {
          return {
            user: null,
            session: null,
            error: "請輸入密碼",
          };
        }

        if (password.length < 6) {
          return {
            user: null,
            session: null,
            error:
              "密碼至少需要 6 個字元",
          };
        }

        const {
          data,
          error,
        } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
        });

        if (error) {
          console.error(
            "會員註冊失敗:",
            error
          );

          return {
            user: null,
            session: null,
            error:
              getAuthErrorMessage(error),
          };
        }

        /**
         * Supabase Auth 註冊成功
         */
        setUser(data.user);
        setSession(data.session);

        return {
          user: data.user,
          session: data.session,
          error: null,
        };
      } catch (error) {
        console.error(
          "會員註冊發生錯誤:",
          error
        );

        return {
          user: null,
          session: null,
          error:
            getAuthErrorMessage(error),
        };
      }
    };

    /**
     * 登入
     */
    const signIn = async (
      email: string,
      password: string
    ): Promise<{
      user: User | null;
      session: Session | null;
      error: string | null;
    }> => {
      try {
        const normalizedEmail =
          email.trim().toLowerCase();

        if (!normalizedEmail) {
          return {
            user: null,
            session: null,
            error: "請輸入 Email",
          };
        }

        if (!password) {
          return {
            user: null,
            session: null,
            error: "請輸入密碼",
          };
        }

        const {
          data,
          error,
        } =
          await supabase.auth.signInWithPassword(
            {
              email: normalizedEmail,
              password,
            }
          );

        if (error) {
          console.error(
            "會員登入失敗:",
            error
          );

          return {
            user: null,
            session: null,
            error:
              getAuthErrorMessage(error),
          };
        }

        setUser(data.user);
        setSession(data.session);

        return {
          user: data.user,
          session: data.session,
          error: null,
        };
      } catch (error) {
        console.error(
          "會員登入發生錯誤:",
          error
        );

        return {
          user: null,
          session: null,
          error:
            getAuthErrorMessage(error),
        };
      }
    };

    /**
     * 登出
     */
    const signOut = async (): Promise<{
      error: string | null;
    }> => {
      try {
        const {
          error,
        } = await supabase.auth.signOut();

        if (error) {
          console.error(
            "會員登出失敗:",
            error
          );

          return {
            error:
              getAuthErrorMessage(error),
          };
        }

        setUser(null);
        setSession(null);

        return {
          error: null,
        };
      } catch (error) {
        console.error(
          "會員登出發生錯誤:",
          error
        );

        return {
          error:
            getAuthErrorMessage(error),
        };
      }
    };

    /**
     * 重新取得目前 Session
     */
    const refreshSession =
      async (): Promise<void> => {
        try {
          const {
            data,
            error,
          } =
            await supabase.auth.refreshSession();

          if (error) {
            console.error(
              "更新 Session 失敗:",
              error
            );

            return;
          }

          setSession(data.session);
          setUser(
            data.session?.user ?? null
          );
        } catch (error) {
          console.error(
            "更新 Session 發生錯誤:",
            error
          );
        }
      };

    return (
      <AuthContext.Provider
        value={{
          user,
          session,
          loading,
          signUp,
          signIn,
          signOut,
          refreshSession,
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  }

  /**
   * Auth Hook
   */
  export function useAuth() {
    const context =
      useContext(AuthContext);

    if (!context) {
      throw new Error(
        "useAuth 必須在 AuthProvider 裡使用"
      );
    }

    return context;
  }
