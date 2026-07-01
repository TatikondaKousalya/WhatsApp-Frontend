import client from "./client";

export async function getGroupMembers(groupId) {

    const response = await client.get(`/groups/${groupId}/members`);

    return response.data.data;
}