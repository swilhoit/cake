import { useEffect } from 'react';

const AboutPage = () => {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    // Update page title
    document.title = 'About Us | Kien Giang Bakery';
  }, []);

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="opacity-100 transform transition-all duration-500 ease-in-out">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">About Us</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="rounded-lg overflow-hidden shadow-lg">
            <img 
              src="/images/bakery-storefront.jpg" 
              alt="Kien Giang Bakery Storefront" 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex flex-col justify-center">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Our Story</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Kien Giang Bakery has been serving the Greater Los Angeles Area since 1980, we are located in Echo Park, the heart of Los Angeles, about 30 miles north of Little Saigon and minutes away from China Town. We specialize in birthdays, weddings, quinceañeras, and all occasion cakes. There are cake specialists on-site to design and create a unique cake for your own special occasion.
            </p>
          </div>
        </div>
        
        <div className="bg-gray-50 p-8 rounded-lg mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Seasonal Specialties</h2>
          <p className="text-gray-700 mb-6 leading-relaxed">
            Kien Giang Bakery produces seasonal items for the Chinese New Year and Mid-Autumn Festival. During the Chinese New Year, Kien Giang Bakery craft fully hand-makes their Banh Tet and Banh Chung. Many delicious Asian cookies and candies are also available only during this time. For the Mid-Autumn Festival, Kien Giang Bakery makes over 40 different varieties of Mooncakes. We take pride in the fact that their Banh Tet, Banh Chung, and Mooncakes are made fresh on our premises.
          </p>
        </div>
        
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Daily Fresh Baked Goods</h2>
          <p className="text-gray-700 mb-6 leading-relaxed">
            On a daily basis, Kien Giang Bakery also offers a variety of baked goods, pastries, sandwiches, and other delightful goodies to satisfy a craving. All of their products are made daily with the finest and freshest ingredients. Come in and explore what scrumptious treats Kien Giang Bakery can offer you!
          </p>
        </div>
        
        <div className="text-center bg-gray-50 p-8 rounded-lg">
          <p className="text-gray-700 italic leading-relaxed">
            Have a look around and please come visit our Bakery in Los Angeles. We'd like to thank you for visiting and please drop us a few lines to tell us how are we doing or you can check us out on Yelp.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage; 