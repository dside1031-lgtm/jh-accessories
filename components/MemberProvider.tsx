"use client";

import {
createContext,
useCallback,
useContext,
useEffect,
useState,
} from "react";
import { supabase } from "@/lib/supabase";

export type MemberStatus =
| "啟用"
| "停用"
| "黑名單"
| string;

export type Member = {
id: string;
authUserId?: string;
memberCode?: string;
name: string;
email: string;
phone: string;
address: string;
status: MemberStatus;
createdAt: string;
orderCount?: number;
totalSpent?: number;
};

type MemberProviderValue = {
members: Member[];
loading: boolean;
addMember: (
member: Omit<Member, "id" | "createdAt">
) => Promise<Member | null>;
updateMember: (
id: string,
data: Partial<Member>
) => Promise<Member | null>;
deleteMember: (id: string) => Promise<boolean>;
updateMemberStatistics: (
id: string,
orderCount: number,
totalSpent: number
) => Promise<boolean>;
clearMembers: () => Promise<boolean>;
reloadMembers: () => Promise<void>;
};

const MemberContext =
createContext<MemberProviderValue | null>(null);

function normalizeMember(member: any): Member {
return {
id: String(member.id),
authUserId: member?.auth_user_id
? String(member.auth_user_id)
: undefined,
memberCode: member?.member_code
? String(member.member_code)
: undefined,
name: member?.name
? String(member.name)
: "",
email: member?.email
? String(member.email)
: "",
phone: member?.phone
? String(member.phone)
: "",
address: member?.address
? String(member.address)
: "",
status: member?.status
? String(member.status)
: "啟用",
createdAt: member?.created_at
? String(member.created_at)
: "",
orderCount:
member?.order_count !== undefined &&
member?.order_count !== null
? Number(member.order_count)
: 0,
totalSpent:
member?.total_spent !== undefined &&
member?.total_spent !== null
? Number(member.total_spent)
: 0,
};
}

export function MemberProvider({
children,
}: {
children: React.ReactNode;
}) {
const [members, setMembers] = useState<Member[]>([]);
const [loading, setLoading] = useState(true);

const loadMembers = useCallback(async () => {
setLoading(true);


const { data, error } = await supabase
  .from("members")
  .select("*")
  .order("created_at", {
    ascending: false,
  });

if (error) {
  console.error("載入會員失敗:", error);
  setMembers([]);
  setLoading(false);
  return;
}

setMembers(
  Array.isArray(data)
    ? data.map(normalizeMember)
    : []
);

setLoading(false);


}, []);

/**

* 初始載入
*
* 等 Supabase Auth Session 確認後，
* 再載入 members。
*
* 會員 RLS 目前只允許 authenticated
* 使用者讀取自己的會員資料。
*
* 同時監聽登入 / 登出 / Session 更新，
* 避免 Auth 還沒完成初始化時，
* MemberProvider 就先載入空資料。
  */
  useEffect(() => {
  let mounted = true;


const initializeMembers = async () => {



  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!mounted) {
    return;
  }

  if (session?.user) {
    await loadMembers();
  } else {
    setMembers([]);
    setLoading(false);
  }
};

initializeMembers();

const {
  data: { subscription },
} = supabase.auth.onAuthStateChange(
  (event, session) => {
    if (!mounted) {
      return;
    }

    if (
      event === "SIGNED_IN" ||
      event === "TOKEN_REFRESHED" ||
      event === "USER_UPDATED"
    ) {
      if (session?.user) {
        // 避免在 Supabase Auth callback 內直接
        // await 另一個 Supabase request。
        setTimeout(() => {
          if (mounted) {
            loadMembers();
          }
        }, 0);
      }

      return;
    }

    if (event === "SIGNED_OUT") {
      setMembers([]);
      setLoading(false);
    }
  }
);

return () => {
  mounted = false;
  subscription.unsubscribe();
};


}, [loadMembers]);

const addMember = useCallback(
async (
member: Omit<Member, "id" | "createdAt">
): Promise<Member | null> => {
const insertData = {
name: member.name,
email: member.email,
phone: member.phone,
address: member.address,
status: member.status,
member_code: member.memberCode ?? null,
auth_user_id: member.authUserId ?? null,
order_count: member.orderCount ?? 0,
total_spent: member.totalSpent ?? 0,
};


  const { data, error } = await supabase
    .from("members")
    .insert(insertData)
    .select("*")
    .single();

  if (error) {
    console.error("新增會員失敗:", error);
    return null;
  }

  const newMember = normalizeMember(data);

  setMembers((current) => [
    newMember,
    ...current,
  ]);

  return newMember;
},
[]


);

const updateMember = useCallback(
async (
id: string,
data: Partial<Member>
): Promise<Member | null> => {
const updateData: Record<string, unknown> = {};


  if (data.name !== undefined) {
    updateData.name = data.name;
  }

  if (data.email !== undefined) {
    updateData.email = data.email;
  }

  if (data.phone !== undefined) {
    updateData.phone = data.phone;
  }

  if (data.address !== undefined) {
    updateData.address = data.address;
  }

  if (data.status !== undefined) {
    updateData.status = data.status;
  }

  if (data.memberCode !== undefined) {
    updateData.member_code =
      data.memberCode;
  }

  if (data.authUserId !== undefined) {
    updateData.auth_user_id =
      data.authUserId;
  }

  if (data.orderCount !== undefined) {
    updateData.order_count =
      data.orderCount;
  }

  if (data.totalSpent !== undefined) {
    updateData.total_spent =
      data.totalSpent;
  }

  const { data: updatedData, error } =
    await supabase
      .from("members")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

  if (error) {
    console.error("更新會員失敗:", error);
    return null;
  }

  const updatedMember =
    normalizeMember(updatedData);

  setMembers((current) =>
    current.map((item) =>
      item.id === id
        ? updatedMember
        : item
    )
  );

  return updatedMember;
},
[]


);

const deleteMember = useCallback(
async (id: string): Promise<boolean> => {
const { error } = await supabase
.from("members")
.delete()
.eq("id", id);


  if (error) {
    console.error("刪除會員失敗:", error);
    return false;
  }

  setMembers((current) =>
    current.filter((item) => item.id !== id)
  );

  return true;
},
[]


);

const updateMemberStatistics =
useCallback(
async (
id: string,
orderCount: number,
totalSpent: number
): Promise<boolean> => {
const { error } = await supabase
.from("members")
.update({
order_count: orderCount,
total_spent: totalSpent,
})
.eq("id", id);


    if (error) {
      console.error(
        "更新會員統計失敗:",
        error
      );
      return false;
    }

    setMembers((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              orderCount,
              totalSpent,
            }
          : item
      )
    );

    return true;
  },
  []
);


const clearMembers = useCallback(
async (): Promise<boolean> => {
const { error } = await supabase
.from("members")
.delete()
.neq("id", "");


  if (error) {
    console.error(
      "清空會員資料失敗:",
      error
    );
    return false;
  }

  setMembers([]);
  return true;
},
[]


);

const reloadMembers = useCallback(
async () => {
await loadMembers();
},
[loadMembers]
);

return (
<MemberContext.Provider
value={{
members,
loading,
addMember,
updateMember,
deleteMember,
updateMemberStatistics,
clearMembers,
reloadMembers,
}}
>
{children}
</MemberContext.Provider>
);
}

export function useMember() {
const context = useContext(MemberContext);

if (!context) {
throw new Error(
"useMember 必須在 MemberProvider 內使用"
);
}

return context;
}
