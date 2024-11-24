# OTT Platform  

An OTT (Over-the-Top) platform designed to provide users with seamless access to TV shows, movies, and other content. Built with **Directus** for the backend and **Angular** with **Ionic** for the frontend, this platform includes essential features like user authentication, content browsing, search, filtering, and bookmarking.  

## Features  
- **User Authentication**: Secure login and registration functionality.  
- **Content Browsing**: Explore a curated collection of TV shows and movies.  
- **Bookmarking**: Save favorite content for later viewing.  

## Tech Stack  
### Backend  
- **[Directus v9.26](https://directus.io/)**: A headless CMS to manage content and APIs.  

### Frontend  
- **[Angular](https://angular.io/)**: Framework for building dynamic web applications.  
- **[Ionic](https://ionicframework.com/)**: Toolkit for building mobile-ready web apps.  

## Installation  

### Prerequisites  
- **Node.js** (v16 or higher)  
- **npm** (v8 or higher)  
- **Directus** installed locally or hosted.  
- **Angular CLI** (v15 or higher)  

### Backend Setup  
1. Clone the repository:  
   ```bash  
   git clone https://github.com/advait-d/ott-platform.git  
   cd ott-platform/backend  
  
2. Install dependencies:
  ```
  npm install
  ```
3. Configure Directus:

    Update .env with your database and project-specific settings.
   
5. Run the Directus server:
   ```
   npx directus start  
   ```
6. Start the Ionic server:
   ```
   ionic serve  
   ```

## Contributing

Contributions are welcome! Please fork the repository and create a pull request with your proposed changes.

## About 

Created by Advait Deshmukh. Feel free to reach out for any queries or collaboration!
