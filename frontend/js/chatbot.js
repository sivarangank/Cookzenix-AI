// ============================================================
// chatbot.js - CookZenix AI FoodieBot Widget (Enhanced v2)
// ============================================================

const Chatbot = {
  isOpen: false,
  history: [],
  isTyping: false,

  init() {
    this.widget = document.getElementById('chatbot-widget');
    this.panel = document.getElementById('chatbot-panel');
    this.toggle = document.getElementById('chatbot-toggle');
    this.closeBtn = document.getElementById('chatbot-close');
    this.messages = document.getElementById('chatbot-messages');
    this.input = document.getElementById('chatbot-input');
    this.sendBtn = document.getElementById('chatbot-send');
    if (!this.panel || !this.toggle) return;

    this.toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePanel();
    });
    this.closeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closePanel();
    });
    this.sendBtn?.addEventListener('click', () => this.sendMessage());
    this.input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendMessage(); }
    });

    this.addWelcomeMessage();
    this.initQuickReplies();
  },

  togglePanel() {
    this.isOpen ? this.closePanel() : this.openPanel();
  },

  openPanel() {
    this.isOpen = true;
    this.widget?.classList.add('is-open');
    this.panel?.classList.add('active');
    this.toggle?.classList.add('active');
    if (this.toggle) this.toggle.innerHTML = '✕';
    setTimeout(() => this.input?.focus(), 300);
  },

  closePanel() {
    this.isOpen = false;
    this.widget?.classList.remove('is-open');
    this.panel?.classList.remove('active');
    this.toggle?.classList.remove('active');
    if (this.toggle) this.toggle.innerHTML = '🍴';
  },

  addWelcomeMessage() {
    if (!this.messages) return;
    const welcome = `
      <div class="chatbot-msg msg-bot" id="bot-welcome">
        <div class="msg-avatar">🤖</div>
        <div class="msg-bubble">
          <p>Namaste! 🙏 I'm <strong>FoodieBot</strong>, your personal AI chef!</p>
          <p>I can help you with:</p>
          <ul>
            <li>🌴 <strong>South Indian Delicacies:</strong> Dosa, Idli, Sambar, Rasam, Pongal, Appam, Fish Curry, Biryani, Chettinad & more!</li>
            <li>🍛 <strong>North Indian Classics:</strong> Butter Chicken, Dal Makhani, Palak Paneer, Samosa, Chole</li>
            <li>🌍 <strong>World Cuisines:</strong> Italian, Japanese, Mexican, Thai</li>
            <li>✨ <strong>Recipe Creator:</strong> Tell me what ingredients you have and I'll create a full recipe with steps & nutrition!</li>
          </ul>
          <p>What would you like to cook today?</p>
        </div>
      </div>
    `;
    this.messages.innerHTML = welcome;
  },

  initQuickReplies() {
    const quickReplies = [
      '🥞 Make Idli & Sambar',
      '🌴 Kerala Fish Curry',
      '🍛 Chettinad Chicken',
      '✨ I have rice, urad dal',
      '🫘 Dal Makhani recipe',
      '🥥 How to make Coconut Chutney?',
    ];
    const qrContainer = document.createElement('div');
    qrContainer.className = 'quick-replies';
    qrContainer.id = 'quick-replies';
    quickReplies.forEach(reply => {
      const btn = document.createElement('button');
      btn.className = 'quick-reply-btn';
      btn.textContent = reply;
      btn.addEventListener('click', () => {
        qrContainer.remove();
        this.sendMessage(reply);
      });
      qrContainer.appendChild(btn);
    });
    this.messages?.appendChild(qrContainer);
    this.scrollToBottom();
  },

  async sendMessage(text) {
    const message = text || this.input?.value.trim();
    if (!message || this.isTyping) return;
    if (this.input) this.input.value = '';

    // Remove quick replies
    document.getElementById('quick-replies')?.remove();

    // Add user message
    this.addMessage('user', message);
    this.history.push({ role: 'user', content: message });

    // Show typing indicator
    this.showTyping();
    this.isTyping = true;

    try {
      const baseUrl = (typeof API_BASE !== 'undefined') ? API_BASE : 'http://localhost:5000/api';
      const res = await fetch(`${baseUrl}/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: this.history.slice(-10) }),
      });
      const data = await res.json();
      const reply = data.reply || data.message || 'I\'m not sure about that. Try asking something food-related!';
      this.hideTyping();
      this.isTyping = false;
      this.addMessage('bot', reply);
      this.history.push({ role: 'assistant', content: reply });
    } catch (err) {
      this.hideTyping();
      this.isTyping = false;
      const fallback = this.localFallback(message);
      this.addMessage('bot', fallback);
    }
  },

  addMessage(role, text) {
    if (!this.messages) return;
    const div = document.createElement('div');
    div.className = `chatbot-msg msg-${role}`;

    // Enhanced markdown parsing
    const formattedText = this.parseMarkdown(text);

    if (role === 'bot') {
      div.innerHTML = `
        <div class="msg-avatar">🤖</div>
        <div class="msg-bubble">${formattedText}</div>
      `;
    } else {
      div.innerHTML = `<div class="msg-bubble msg-user-bubble">${formattedText}</div>`;
    }
    this.messages.appendChild(div);
    this.scrollToBottom();
  },

  parseMarkdown(text) {
    return text
      // Code blocks
      .replace(/```[\s\S]*?```/g, match => `<pre><code>${match.slice(3, -3)}</code></pre>`)
      // Headers h2
      .replace(/^## (.+)$/gm, '<h4 style="margin:8px 0 4px;color:#e67e22;">$1</h4>')
      // Headers h3
      .replace(/^### (.+)$/gm, '<h5 style="margin:6px 0 3px;color:#e67e22;">$1</h5>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Horizontal rule
      .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #eee;margin:8px 0;">')
      // Bullet lists
      .replace(/^[•\-] (.+)$/gm, '<li style="margin:2px 0;">$1</li>')
      // Wrap consecutive li elements
      .replace(/(<li[^>]*>.*<\/li>\n?)+/g, match => `<ul style="margin:4px 0;padding-left:18px;">${match}</ul>`)
      // Numbered lists
      .replace(/^\d+\. (.+)$/gm, '<li style="margin:2px 0;">$1</li>')
      // Newlines to br
      .replace(/\n/g, '<br>');
  },

  showTyping() {
    if (!this.messages) return;
    const div = document.createElement('div');
    div.className = 'chatbot-msg msg-bot typing-indicator';
    div.id = 'typing-indicator';
    div.innerHTML = `
      <div class="msg-avatar">🤖</div>
      <div class="msg-bubble typing-bubble">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    `;
    this.messages.appendChild(div);
    this.scrollToBottom();
  },

  hideTyping() {
    document.getElementById('typing-indicator')?.remove();
  },

  scrollToBottom() {
    if (this.messages) this.messages.scrollTop = this.messages.scrollHeight;
  },

  // ── Local Fallback ────────────────────────────────────────────
  localFallback(message) {
    const msg = message.toLowerCase();

    // Ingredient-based recipe creation
    const ingredientTriggers = ['what can i make', 'i have', 'using', 'with these', 'cook with', 'recipe with', 'suggest'];
    const isIngredientQuery = ingredientTriggers.some(t => msg.includes(t));

    const ingredients = {
      chicken: ['chicken', 'murgh', 'poultry'],
      paneer: ['paneer', 'cottage cheese'],
      spinach: ['spinach', 'palak', 'saag'],
      potato: ['potato', 'aloo'],
      lentil: ['lentil', 'dal', 'daal', 'urad'],
      tomato: ['tomato'],
      rice: ['rice', 'chawal', 'basmati'],
      egg: ['egg', 'anda'],
      pasta: ['pasta', 'spaghetti', 'noodle'],
      beef: ['beef', 'steak'],
      salmon: ['salmon', 'fish', 'seafood'],
      cauliflower: ['cauliflower', 'gobi'],
      chickpea: ['chickpea', 'chana', 'chole'],
    };

    const recipeMap = {
      'chicken+tomato': '🍗 **Butter Chicken** — Marinate chicken in yogurt+spices, grill until charred, simmer in tomato-butter sauce with cream. Serve with naan!\n\n⏱️ 45 min | 🔥 Difficulty: Medium',
      'paneer+spinach': '🥬 **Palak Paneer** — Blanch spinach, blend smooth. Fry paneer cubes golden. Make onion-tomato masala, add spinach puree, add paneer, finish with cream.\n\n⏱️ 40 min | 🔥 Difficulty: Medium',
      'potato+cauliflower': '🥦 **Aloo Gobi** — Sauté cumin, onions, tomatoes with spices. Add potato cubes, then cauliflower florets. Cook covered on low heat 15 min.\n\n⏱️ 35 min | 🔥 Difficulty: Easy',
      'lentil+tomato': '🫘 **Dal Makhani** — Pressure cook urad dal, simmer in tomato-butter gravy for 30+ min. Finish with cream.\n\n⏱️ 90 min | 🔥 Difficulty: Medium',
      'rice+chicken': '🍛 **Chicken Biryani** — Marinate chicken in yogurt+spices 2 hrs, parboil rice with whole spices, layer and dum cook sealed pot on low heat.\n\n⏱️ 90 min | 🔥 Difficulty: Hard',
      'chickpea+tomato': '🫘 **Chole** — Cook soaked chickpeas, prepare thick onion-tomato-spice masala, simmer chickpeas in it 20 min. Serve with bhature or rice!\n\n⏱️ 50 min | 🔥 Difficulty: Medium',
      'egg+tomato': '🍳 **Shakshuka** — Simmer peppers and onions in spiced tomato sauce. Crack eggs into wells, cover and cook until whites set. Serve with crusty bread!\n\n⏱️ 25 min | 🔥 Difficulty: Easy',
      'pasta+egg': '🍝 **Spaghetti Carbonara** — Cook spaghetti al dente. Fry pancetta crispy. Off heat, toss with egg+cheese mixture and pasta water.\n\n⏱️ 25 min | 🔥 Difficulty: Medium',
      'salmon+lemon': '🐟 **Lemon Butter Salmon** — Pat skin dry, sear skin-side down 5 min, flip 1 min, finish with garlic butter and lemon.\n\n⏱️ 15 min | 🔥 Difficulty: Easy',
      'rice+egg': '🍳 **Egg Fried Rice** — Stir-fry scrambled eggs with day-old rice, soy sauce, sesame oil, garlic and vegetables.\n\n⏱️ 20 min | 🔥 Difficulty: Easy',
    };

    if (isIngredientQuery || msg.split(',').length >= 2) {
      const foundIngredients = [];
      for (const [key, terms] of Object.entries(ingredients)) {
        if (terms.some(t => msg.includes(t))) foundIngredients.push(key);
      }

      if (foundIngredients.length > 0) {
        // Try to match a recipe
        for (const [combo, recipe] of Object.entries(recipeMap)) {
          const comboIngredients = combo.split('+');
          if (comboIngredients.every(ci => foundIngredients.includes(ci))) {
            return `✨ **Great! Here's what you can make with your ingredients:**\n\n${recipe}\n\nWant the full detailed recipe with all steps? Ask me "Full recipe for [dish name]" and I'll give you everything!`;
          }
        }

        // At least found some ingredients
        const recSuggestions = foundIngredients.includes('chicken')
          ? 'Butter Chicken, Chicken Biryani, Chicken Tikka Masala, or Grilled Chicken'
          : foundIngredients.includes('paneer')
          ? 'Palak Paneer, Paneer Tikka, Malai Kofta, or Paneer Butter Masala'
          : foundIngredients.includes('potato')
          ? 'Aloo Gobi, Samosa, Aloo Paratha, or Chole with Bhature'
          : 'a delicious curry, stir-fry, or rice dish';
        return `✨ With the ingredients you have, you could make **${recSuggestions}**!\n\nTell me which one you'd like and I'll give you the full step-by-step recipe! 😊`;
      }
    }

    const rules = [
      { keys: ['butter chicken', 'murgh makhani'], reply: '🍗 **Butter Chicken Recipe:**\n\n**Marinate:** 800g chicken in 1 cup yogurt + lemon + spices (2 hrs)\n**Grill** chicken until charred\n**Sauce:** Sauté onions in 3 tbsp butter → add ginger-garlic paste → 400ml tomato puree + spices → blend smooth → add chicken + 200ml cream\n**Simmer** 10 min → garnish with cilantro\n\n🔑 Secret: Add kasuri methi at the end for authentic flavor!' },
      { keys: ['biryani', 'dum biryani'], reply: '🍛 **Chicken Biryani (Dum Method):**\n\n1. Marinate chicken in yogurt + biryani masala (2 hrs)\n2. Fry onions until golden (barista)\n3. Parboil basmati rice with whole spices (70% cooked)\n4. Layer: chicken → rice → fried onions → mint → saffron milk → ghee\n5. Seal pot tightly and dum cook (high 5 min, low 25 min)\n6. Rest 10 min, then gently mix\n\n🔑 Never open the sealed pot during dum cooking!' },
      { keys: ['palak paneer', 'saag paneer'], reply: '🥬 **Palak Paneer:**\n\n1. Blanch spinach 2 min → blend smooth\n2. Fry paneer cubes golden\n3. Sauté onions → add ginger-garlic paste + tomatoes\n4. Add spices and spinach puree, simmer 10 min\n5. Add fried paneer + 3 tbsp cream\n6. Serve with roti or naan!' },
      { keys: ['dal', 'daal', 'lentil'], reply: '🫘 **Dal Makhani:**\n\n1. Soak urad dal + kidney beans overnight\n2. Pressure cook 20 min\n3. Temper cumin in butter, sauté onions golden\n4. Add ginger-garlic paste + tomato puree + spices\n5. Add cooked dal, simmer on LOW 30 min\n6. Stir in 1/2 cup cream, garnish with butter and cilantro\n\n🔑 The key is slow simmering — longer = richer!' },
      { keys: ['samosa'], reply: '🥟 **Samosa Recipe:**\n\n**Dough:** Mix 2 cups flour + 4 tbsp oil + ajwain + salt + water → stiff dough, rest 30 min\n**Filling:** Sauté cumin + peas, mix with mashed potatoes + spices + amchur + cilantro\n**Shape:** Roll dough, cut half-ovals, form cones, fill and seal tightly\n**Fry:** Medium heat oil until golden (8-10 min)\n\nServe with mint chutney and tamarind sauce!' },
      { keys: ['gulab jamun'], reply: '🍬 **Gulab Jamun:**\n\n**Dough:** 1 cup milk powder + 3 tbsp flour + 1/4 tsp baking soda + 2 tbsp ghee + milk (soft dough)\n**Syrup:** 2 cups sugar + 2 cups water + cardamom + rose water\n**Fry** smooth balls on LOW heat until dark brown (10-12 min)\n**Soak** in warm syrup minimum 30 minutes\n\n🔑 No cracks in balls = they won\'t burst while frying!' },
      { keys: ['chole', 'chana', 'chickpea'], reply: '🫘 **Chole (Chickpea Curry):**\n\n1. Pressure cook soaked chickpeas 20 min\n2. Deep brown onions in oil (10-12 min)\n3. Add ginger-garlic paste + chole masala + tomato puree\n4. Cook until oil separates\n5. Add chickpeas, mash a few to thicken\n6. Simmer 20 min, serve with bhature, puri or rice!' },
      { keys: ['pasta', 'spaghetti', 'carbonara'], reply: '🍝 **Quick Carbonara:**\n\n1. Cook spaghetti al dente (save 1 cup pasta water!)\n2. Fry pancetta/bacon with garlic until crispy\n3. Whisk 4 eggs + Pecorino Romano + black pepper\n4. Off the heat: toss pasta with pancetta, pour egg mix, add pasta water gradually\n5. Toss vigorously until creamy\n\n🔑 Never use cream! The pasta water + eggs make the sauce!' },
      { keys: ['egg', 'shakshuka'], reply: '🍳 **Shakshuka:**\n\n1. Heat oil, sauté diced onion + pepper (8 min)\n2. Add garlic + cumin + paprika + chili flakes\n3. Pour in canned crushed tomatoes, simmer 10 min\n4. Make 6 wells, crack eggs into each\n5. Cover and cook 8-10 min (whites set, yolk runny)\n6. Top with feta, cilantro and serve with crusty bread!' },
      { keys: ['vegetarian', 'veg recipe', 'no meat'], reply: '🌿 **Best Indian Vegetarian Recipes:**\n\n1. 🥬 **Palak Paneer** — Spinach with paneer (40 min)\n2. 🫘 **Dal Makhani** — Rich black lentil curry (90 min)\n3. 🥦 **Aloo Gobi** — Potato & cauliflower (35 min)\n4. 🫘 **Chole** — Spiced chickpea curry (50 min)\n5. 🥟 **Samosa** — Crispy stuffed pastry (60 min)\n6. 🍡 **Masala Dosa** — Crispy South Indian crepe\n\nWhich one would you like the full recipe for?' },
      { keys: ['chicken'], reply: '🍗 **Top Indian Chicken Recipes:**\n\n1. **Butter Chicken** — Creamy tomato sauce (45 min)\n2. **Chicken Biryani** — Aromatic layered rice (90 min)\n3. **Chicken Tikka Masala** — Grilled chicken in masala gravy (60 min)\n4. **Chicken Korma** — Rich creamy mild curry (50 min)\n\nWhich recipe would you like? I\'ll give you the full step-by-step!' },
      { keys: ['quick', 'easy', 'fast', '15 min', '30 min', 'simple', 'beginner'], reply: '⚡ **Quick Recipes (Under 30 Minutes):**\n\n1. 🍳 **Egg Bhurji** (10 min) — Spiced scrambled eggs\n2. 🥑 **Avocado Toast** (10 min) — Add a poached egg!\n3. 🍳 **Shakshuka** (25 min) — Eggs in tomato sauce\n4. 🍚 **Egg Fried Rice** (20 min) — Use leftover rice!\n5. 🥦 **Aloo Gobi** (25 min) — Simple potato-cauliflower curry\n6. 🍝 **Pasta Aglio e Olio** (20 min) — Garlic, olive oil, pasta\n\nTell me what ingredients you have and I\'ll create the perfect quick recipe!' },
      { keys: ['breakfast', 'morning', 'brunch'], reply: '🌅 **Breakfast Ideas:**\n\n🫓 **South Indian:** Masala Dosa with sambar & chutney\n🍡 **Indian:** Upma, Poha, or Idli-Sambar\n🥞 **Classic:** Fluffy pancakes with maple syrup\n🥑 **Trendy:** Avocado toast with poached egg\n🍳 **Middle Eastern:** Shakshuka (eggs in tomato sauce)\n🥣 **Healthy:** Overnight oats with fruits\n\nWhat sounds good? I can give you the full recipe for any!' },
      { keys: ['healthy', 'diet', 'weight loss', 'low calorie'], reply: '💪 **Healthy Meal Suggestions:**\n\n🥗 **Low-Cal Indian:** Dal Tadka, Aloo Gobi, Rajma (skip the butter), grilled tandoori chicken\n🥬 **High-Protein:** Palak Paneer (no cream), Chole, Moong Dal\n🍽️ **Balanced Plate:** Half vegetables, quarter protein, quarter complex carbs\n🥤 **Hydration:** Chaas (buttermilk with cumin and mint) instead of sodas!\n\nWant a specific healthy recipe idea?' },
      { keys: ['hello', 'hi', 'hey', 'namaste', 'kem cho', 'vanakkam'], reply: '👋 **Namaste! Welcome to CookZenix AI!** 🙏\n\nI\'m FoodieBot — I specialize in Indian recipes and world cuisine!\n\n**✨ Try asking me:**\n• *"How do I make Butter Chicken?"*\n• *"I have paneer, spinach and cream — what can I cook?"*\n• *"Give me a quick vegetarian recipe"*\n• *"Biryani step by step recipe"*\n\nWhat would you like to cook today? 🍽️' },
      { keys: ['thanks', 'thank you', 'great', 'helpful'], reply: '😊 You\'re welcome! Happy cooking! 🍽️\n\nRemember — the secret ingredient is always love and patience. Don\'t be afraid to experiment!\n\nFeel free to ask me anything else about recipes, or tell me what ingredients you have and I\'ll create a recipe for you! 🍴' },
      { keys: ['indian', 'indian food', 'indian cuisine', 'indian recipe'], reply: '🇮🇳 **Indian Cuisine — What Would You Like?**\n\n**North Indian:**\n• Butter Chicken, Chole Bhature, Dal Makhani, Rajma Chawal, Biryani\n\n**South Indian:**\n• Masala Dosa, Idli-Sambar, Rasam, Curd Rice\n\n**Street Food:**\n• Samosa, Pani Puri, Chole Bhature, Pav Bhaji\n\n**Desserts:**\n• Gulab Jamun, Kheer, Rasgulla, Halwa\n\nJust ask for any of these and I\'ll give you the full recipe! 🍛' },
    ];

    for (const rule of rules) {
      if (rule.keys.some(k => msg.includes(k))) return rule.reply;
    }

    const defaults = [
      '🍽️ I\'d love to help! Try asking me things like:\n• *"What can I make with chicken and tomatoes?"*\n• *"How do I make Biryani?"*\n• *"Give me a quick vegetarian recipe"*\n• *"I have paneer, spinach at home"*',
      '👨‍🍳 I specialize in Indian cuisine and world recipes! Ask me for a recipe by name, or tell me your ingredients and I\'ll create one for you. 🍛',
      '✨ Interesting! For the best advice, try asking about specific dishes or tell me what ingredients you have. I can create full recipes with ingredients and steps! 🍽️',
    ];
    return defaults[Math.floor(Math.random() * defaults.length)];
  },
};

document.addEventListener('DOMContentLoaded', () => {
  Chatbot.init();
});
