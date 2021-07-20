<script>
  export function handleAlert() {
    alert("I got a click!");
  }
</script>

<main>
  <header>
    <h1>JAMES CALINGO</h1>
  </header>

  <h2>
    Hi! I'm James Calingo (or "JC" as my friends call me), and I'm a full stack
    web developer.
  </h2>

  <div>
    <div id="paragraph">
      <div>
        <h4>
          I have experience with modern HTML, CSS, and JavaScript frameworks and
          practices
        </h4>
      </div>
      <div class="card">
        <p>Want to get in touch?</p>
        <button><a href="#contact-form">Let's talk!</a></button>
      </div>
    </div>

    <div id="bullets">
      <div>
        <h2>Scalability/Maintanable development</h2>
        <p class="description">
          Using the latest frameworks and tools, make a website that looks and
          functions well on computers, phones, and tablets.
        </p>
      </div>

      <div>
        <h2>Accesibility/Web Standards</h2>
        <p class="description">
          Make a site that is accessible to everyone - most especially those
          with disablilites.
        </p>
      </div>

      <div>
        <h2>Performance</h2>
        <p class="description">
        Work on Search Engine Optimization (SEO), data-driven research, and more.
        </p>
      </div>
    </div>
  </div>

  <div id="gallery">
    This area will be a gallery with images of projects
  </div>

  <div id="testemonial" class="card">
    <h2>What they're saying</h2>
    <ul>
      <li>
        <blockquote>"Lorem ipsum dolor sit amet consectetur adipisicing elit. Explicabo nam sed, ex natus animi voluptate dolor molestiae. Ullam hic ratione officiis dicta. Labore aspernatur consequuntur quam ex atque quidem dolorum."</blockquote>
      </li>
      <li>
        <blockquote>
          "Lorem ipsum dolor sit amet consectetur adipisicing elit. Laudantium
          sequi perspiciatis voluptatibus ipsam odit amet maxime impedit eos
          saepe reiciendis? Soluta id molestias accusantium sint facere ducimus
          nulla dolores est."
        </blockquote>
      </li>
      <li>
        <blockquote>
         "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Tenetur ipsa, at temporibus dolorum labore eos fugit quae vitae eum non eligendi alias, laborum, velit cum voluptatibus expedita qui ratione itaque.""
        </blockquote>
      </li>
    </ul>
  </div>

  <div id="contact-form">
    <h2>Let's get in touch!</h2>
    <label for="name">Name</label>
    <input type="text" />

    <label for="email">Email</label>
    <input type="text" />

    <label for="description">Describe your idea</label>
    <textarea name="description" id="description" rows="10" />
    <br />
    <button on:click={handleAlert} type="submit">Submit</button>

    <p>Alternatively, you can send me an email here:</p>
    <button>
      <a href="mailto:jciscreative@gmail.com">Email me!</a>
    </button>
  </div>
</main>
<p>
  This site was made using <a href="https://svelte.dev" target="blank">Svelte</a
  >
</p>

<style>
  main {
    text-align: center;
    max-width: 240px;
    margin: 0 auto;
  }

  header {
    justify-content: center;
    font-weight: bolder;
    margin-bottom: 30px;
    height: 150px;
    line-height: 150px;
    color: white;
    background: green;
  }

  input {
    width: 80%;
  }

  .card {
    margin-bottom: 50px;
    border: 3px solid green;
    border-radius: 10px;
  }

  #gallery {
    height: 400px;
    border: 3px dashed black;
    margin-bottom: 50px;
  }

  #contact-form {
    border: 3px solid black;
    border-radius: 10px;
  }

  @media (min-width: 640px) {
    main {
      max-width: 70%;
    }

    h1 {
      font-size: 4em;
    }

    input,
    textarea {
      width: 50%;
    }

    button {
      background: midnightblue;
      color: white;
      border-radius: 10px;
      height: 50px;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 16pt;
    }

    button a {
      color: white;
    }

    blockquote {
  
      height: 200px;
      border: 3px solid orange;
    }

    .card {
      margin-bottom: 50px;
      border: 3px solid green;
      border-radius: 10px;
    }

    #bullets {
      margin-top: 30px;
      display: flex;
      justify-content: space-evenly;
    }

    #bullets div {
      width: 25%;
    }

    #paragraph {
      display: grid;
      grid-template-columns: 2fr 1fr;
    }

    .description {
      font-size: 18pt;
    }

    #testemonial ul {
      display: flex;
      list-style: none;
    }

    #testemonial li {
      margin: 15px 0;
    }
  }
</style>
