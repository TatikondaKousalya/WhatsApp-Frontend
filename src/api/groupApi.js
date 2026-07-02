import client from "./client";

export async function getGroupMembers(groupId) {

    const response = await client.get(`/groups/${groupId}/members`);

    return response.data.data;
}

// POST /groups/{groupId}/members/{userId}
// Backend returns the updated member list or the added member object.
export async function addGroupMember(groupId, userId) {
  const response = await client.post(`/groups/${groupId}/members/${userId}`);
  return response.data;
}