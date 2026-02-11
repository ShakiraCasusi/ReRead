# Fix MongoDB Connection String

If your current connection string format is incorrect. Here's how to fix it:

## Current (WRONG):
```
mongodb+srv://casusishakira28_db_user:Pnzzle0408reread.t50rlbx.mongodb.net/?appName=ReRead
```

## Correct Format:
```
mongodb+srv://casusishakira28_db_user:Pnzzle0408@cluster0.t50rlbx.mongodb.net/reread?retryWrites=true&w=majority
```

## Steps to Fix:

1. **Go to MongoDB Atlas:**
   - Login at https://www.mongodb.com/cloud/atlas
   - Click on your cluster

2. **Get the correct connection string:**
   - Click "Connect" button
   - Choose "Connect your application"
   - Select "Node.js" as driver
   - Copy the connection string

3. **The format should be:**
   ```
   mongodb+srv://<username>:<password>@<cluster-name>.<cluster-id>.mongodb.net/<database-name>?retryWrites=true&w=majority
   ```

4. **Update your `.env` file:**
   - Open `backend/.env`
   - Replace the MONGODB_URI line with the correct format
   - Make sure:
     - Username and password are correct
     - Cluster name is included (usually `cluster0`)
     - Database name is included (use `reread`)
     - No extra characters or spaces

## Example:
```env
MONGODB_URI=mongodb+srv://casusishakira28_db_user:Pnzzle0408@cluster0.t50rlbx.mongodb.net/reread?retryWrites=true&w=majority
```

## Important Notes:
- Replace `<password>` with your actual password (no encoding needed)
- The cluster name is usually `cluster0` but check your Atlas dashboard
- Make sure there are no spaces in the connection string
- The database name (`reread`) should be included before the `?`
