import { Alert } from 'react-native';
import { Client, Account, Avatars, Databases, ID, Query, Storage } from 'react-native-appwrite';

export const appwriteConfig = {
    endpoint: "https://cloud.appwrite.io/v1",
    platform: "com.pihu.aora",
    projectId: "66a2629900092f315c65",
    databaseId: "66a26622002883a534f4",
    userCollectionId: "66a266bb0004a7e32656",
    videoCollectionId: "66a267590020fd20fd85",
    storageId: "66a2681a000382b62f40"
}


// Init your React Native SDK
const client =  new Client();

client
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId)
  .setPlatform(appwriteConfig.platform);

const account = new Account(client);
const avatar = new Avatars(client);
const database = new Databases(client);
const storage = new Storage(client);


export const createUser = async (email, password, name) => {
    try{
            // Register User in auth
        const newAccount = await account.create(ID.unique(), email, password, name)

        if(!newAccount){
            throw new Error("User could not be  created bhiya");
        }

        const avatarUrl =  avatar.getInitials(name);

        // sign in
        await signin(email,password);

        // create in database
        const newUser = await database.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            ID.unique(),
            {
                accountId : newAccount.$id,
                name: name,
                email: email,
                avatar: avatarUrl
            }
        );
        if(!newUser) throw new Error("User could not be created in database bhiya");

        return newUser;
    }
    catch(e){
        throw new Error("create user me error ");
    }
}

export const signin = async (email, password) => {
    try{
       const session =  await account.createEmailPasswordSession(email, password);
       return session;
    }
    catch(e){
        new Error("Signin me error");
    }
}

export async function getAccount() {
    try {
      const currentAccount = await account.get();
  
      return currentAccount;
    } catch (error) {
      throw new Error(error);
    }
  }
  
// Get Current User
export async function getCurrentUser() {
    try {
      const currentAccount = await getAccount();
      if (!currentAccount) throw Error;
  
      const currentUser = await database.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        [Query.equal("accountId", currentAccount.$id)]
      );
  
      if (!currentUser) throw Error("get current  user me error bhiya");
  
      return currentUser.documents[0];
    } catch (error) {
      console.log(error);
      return null;
    }
  }



  

export async function getAllPosts() {
    try {
      const posts = await database.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.videoCollectionId
      );
  
      return posts.documents;
    } catch (error) {
      throw new Error(error);
    }
  }

export async function getLatestPosts() { 
  try {
    const posts = await database.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.orderDesc("$createdAt"), Query.limit(7)]
    );


    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

export async function SearchPosts(query) { 
  try {
    const posts = await database.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.search("title",query)]
    );


    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

export async function getUserPosts(userId) { 
  try {
    const posts = await database.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.equal("user",userId)]
    );


    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

export const signOut = async () => {
    try {
      const session = await account.deleteSession("current");
      return session;
    } catch (error) {
      throw new Error(error);
    }
  }








 export async function getFilePreview(fileId, type) {
    let fileUrl;
  
    try {
      if (type === "video") {
        fileUrl = storage.getFileView(appwriteConfig.storageId, fileId);
      } else if (type === "image") {
        fileUrl = storage.getFilePreview(
          appwriteConfig.storageId,
          fileId,
          2000,
          2000,
          "top",
          100
        );
      } else {
        throw new Error("Invalid file type");
      }
  
      if (!fileUrl) throw Error;
  
      return fileUrl;
    } catch (error) {
      throw new Error(error);
    }
}


export async function uploadFile(file, type) {
    if (!file) return;

    const { mimeType, ...rest } = file;
    const asset = { type: mimeType, ...rest };

    try {
      const uploadedFile = await storage.createFile(
        appwriteConfig.storageId,
        ID.unique(),
        asset
      );

      const fileUrl = await getFilePreview(uploadedFile.$id, type);
      return fileUrl;
    } catch (error) {
      throw new Error(error);
    }
}

// Create Video Post
export async function createVideoPost(form) {
  try {
    const [thumbnailUrl, videoUrl] = await Promise.all([
      uploadFile(form.thumbnail, "image"),
      uploadFile(form.video, "video"),
    ]);

    const newPost = await database.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      ID.unique(),
      {
        title: form.title,
        thumbnail: thumbnailUrl,
        video: videoUrl,
        prompt: form.prompt,
        user: form.userId,
      }
    );

    return newPost;
  } catch (error) {
    throw new Error(error);
  }
}