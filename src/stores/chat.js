import { defineStore } from "pinia";



export const useChatStore = defineStore("chat", {
    state: () => ({
        messages: [],
        loading: false,
        selectedModel:{}
    }),

    actions: {
        async generate(prompt) {
            // Add bot message placeholder (at last index)
            if (!this.selectedModel.name) {
                return;
            }
        
            this.loading = true;
        
            // Add user message
            this.messages.push({
                text: prompt,
                isUser: true,
                response: prompt,
            });
        
            
            this.messages.push({
                text: "",
                isUser: false,
                response: "",
            });
        
            // Get the correct index of the bot response
            const messageIndex = this.messages.length - 1;
        
            const formData = {
                model: this.selectedModel?.name,
                prompt: prompt,
            };
        
            try {
                // Send the request using fetch
                const response = await fetch("http://localhost:11434/api/generate", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(formData),
                });
        
                if (!response.ok) {
                    throw new Error(`Error: ${response.statusText}`);
                }
        
                // Read the stream
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
        
                // Process the streaming response
                const readStream = async () => {
                    while (true) {
                        const { done, value } = await reader.read();
        
                        if (done) {
                            this.loading = false;
                            break;
                        }
        
                        const chunkText = decoder.decode(value, { stream: true });
        
                        // Handle possible multiple JSON lines in the chunk
                        const jsonLines = chunkText.trim().split("\n");
        
                        for (const line of jsonLines) {
                            try {
                                const parsed = JSON.parse(line);
                                if (parsed.response) {
                                    this.messages[messageIndex].text += parsed.response;
                                    this.messages[messageIndex].response += parsed.response;
                                }
                            } catch (error) {
                                console.warn("Skipping invalid JSON chunk:", line);
                            }
                        }
                    }
                };
        
                // Start reading the stream
                await readStream();
            } catch (error) {
                console.error("Error generating:", error.message);
            } finally {
                this.loading = false;
            }
        },

        async get_models(){
            const response = await fetch("http://localhost:11434/api/tags", {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                
            });
            const decoder = new TextDecoder();

            const { done, value } = await response.body.getReader().read()
            return JSON.parse(decoder.decode(value, { stream: true })).models
            
        },

        async getGetTitle(userPrompt){
            const basePrompt = "Based on the user's first message, generate a short, descriptive chat title (20-30 characters). Make sure it's concise and relevant to the content of the message without adding any extra characters or strings. just raw output"
            const formData = {
                model: this.selectedModel?.name,
                prompt: `${basePrompt}:\n\n${userPrompt}`,
                stream: false
            }
            const response = await fetch("http://localhost:11434/api/generate", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData),
                
            });
            const decoder = new TextDecoder();

            const { done, value } = await response.body.getReader().read()
            
            
            return JSON.parse(decoder.decode(value, { stream: true })).response
            
        }
    }
});
