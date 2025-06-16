"use server";

export default async function sendMessage(name : string, email : string, subject : string, message : string) {
  console.log(name, email, subject, message);
}