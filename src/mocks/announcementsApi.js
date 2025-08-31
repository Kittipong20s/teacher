// src/mocks/announcementsApi.js
import { delay, announcements } from './db';

export async function getAnnouncements() {
  await delay(250);
  return announcements.slice().sort((a, b) => b.created_at.localeCompare(a.created_at));
}