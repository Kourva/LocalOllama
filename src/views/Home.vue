<template>
    <main class="chat-page">
        <div class="chat-container">
            <aside class="chat-sidebar" :class="{ 'collapsed': sideBarCollapse }">
                <div class="sidebar-head"  :class="{ 'collapsed': sideBarCollapse }">
                    <span class="sidebar-head-title" :class="{active: !sideBarCollapse}">
                        Local Ollama
                    </span>
                    <img class="collapse-image" 
                         @click="toggleSidebar" 
                         :src="!sideBarCollapse ? collapseImage : collapseImageFlip" alt="collapse-image" />
                </div>
            </aside>

            <section class="chat-section">
                <header class="chat-header" :class="{ active: sideBarCollapse }">
                    <transition name="fade" mode="out-in">
                        <span :key="chatTitle">
                            {{ chatTitle.length > 70 ? chatTitle.slice(0, 70) + '...' : chatTitle  || 'New Chat' }}
                        </span>
                    </transition>
                </header>

                <div class="chat-content">
                    <div class="messages-container" ref="messagesContainer">
                        <TransitionGroup name="message" v-if="chatStore.messages.length > 0">
                            <div v-for="(message, index) in chatStore.messages" :key="index" class="message-wrapper">
                                <div :class="['message', { 'user-message': message.isUser, 'bot-message': !message.isUser }]">
                                    <div class="message-content">
                                        <Markdown v-if="message.text && !message.isUser" :content="message.text" />
                                        <div class="user-message-content" v-if="message.text && message.isUser">
                                            {{ message.text }}
                                        </div>
                                        <div v-else class="typing-loader">
                                            <span></span><span></span><span></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TransitionGroup>
                        <div v-else class="default-message">
                            Hello how can i assist you today?
                        </div>
                    </div>

                    <div class="input-bar">
                        <textarea 
                            ref="textarea" 
                            @keydown.enter.exact.prevent="sendMessage"
                            @keydown.shift.enter="newLine" 
                            @input="adjustHeight" 
                            class="input-element"
                            v-model="chatInput" 
                            placeholder="Send message..." 
                        />
                        <div class="input-actions">
                            <div class="model-container" @click.stop="toggleModels">
                                <img 
                                    :class="{ waiting: !chatStore.selectedModel?.name }" 
                                    class="model-image"
                                    :src="modelImage" 
                                    alt="chat-image" 
                                />
                                <span class="selected-model">
                                    {{ chatStore.selectedModel?.name || 'select model' }}
                                </span>
                                <div class="models-container" v-if="showModels" ref="modelsContainer">
                                    <ul>
                                        <li v-for="model in models"
                                            :class="{active: chatStore.selectedModel.name === model.name}" 
                                            @click.stop="selectModel(model)"
                                        >
                                            {{ model.model }}
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <img :src="sendImage" class="send-icon" @click="sendMessage" />
                        </div>
                    </div>
                    <span class="footer">Made with &lt;3 by Kourva, hope you like it ;) </span>
                </div>
            </section>
        </div>
    </main>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useChatStore } from "@/stores/chat";

import collapseImage from "@/assets/svg/duzzle/sidebar.svg";
import collapseImageFlip from "@/assets/svg/duzzle/sidebar-flip.svg";
import sendImage from "@/assets/svg/duzzle/send.svg";
import modelImage from "@/assets/svg/duzzle/camera-alt-2.svg";

import Markdown from "@/components/inputs/prettyMD.vue";

const sideBarCollapse = ref(false);
const chatInput = ref("");
const chatStore = useChatStore();
const messagesContainer = ref(null);
const textarea = ref(null);
const models = ref([]);
const showModels = ref(false);
const chatTitle = ref("")
const modelsContainer = ref(null)

function toggleModels() {
    showModels.value = !showModels.value;
}

function selectModel(model) {
    chatStore.selectedModel = model;
    showModels.value = false;
}

const toggleSidebar = () => {
    sideBarCollapse.value = !sideBarCollapse.value;
};

const handleClickOutside = (event) => {
    const modal = modelsContainer.value;
    if (modal && !modal.contains(event.target)) {
        showModels.value = false;
    }
};

const sendMessage = async () => {
    const userPrompt = chatInput.value
    if (userPrompt.trim() !== "" && chatStore.selectedModel?.model) {
        chatStore.generate(userPrompt);
        
        chatInput.value = "";
        await nextTick();
        scrollToBottom();

        if(chatStore.messages.length < 3){
            chatTitle.value = await chatStore.getGetTitle(userPrompt)
            document.title = `LO | ${chatTitle.value}`
        }
    }
};

const scrollToBottom = async () => {
    await nextTick();
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
};

const adjustHeight = () => {
    const textareaElement = textarea.value;
    if (textareaElement) {
        textareaElement.style.height = 'auto';
        textareaElement.style.height = `${textareaElement.scrollHeight}px`;
    }
};

watch(() => chatStore.messages, async () => {
    await nextTick();
    scrollToBottom();
}, { deep: true, immediate: true });

watch(chatInput, () => {
    nextTick(() => {
        adjustHeight();
    });
});

onMounted(async () => {
    models.value = await chatStore.get_models();
    scrollToBottom();
    adjustHeight();

    document.addEventListener('click', handleClickOutside);

});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.chat-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;
    overflow: hidden;
}

.chat-container {
    display: flex;
    flex: 1;
    height: 100vh;
    width: 100%;
}

.chat-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: #f4f4f4;
    width: 100%;
}

.chat-header {
    color: white;
    padding: 15px;
    font-weight: bold;
    font-size: 20px;
    background-color: var(--secondary-color);
    width: 100%;
    height: 40px;
    z-index: 2;
    box-shadow: 0 5px 40px -2px #212121;
    
}

.chat-content {
    flex: 1;
    padding: 0 20px 20px 20px;
    background-color: var(--secondary-color);
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: hidden;
}

.messages-container {
    flex-grow: 1;
    width: 100%;
    max-width: 100vw;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
}
.message-wrapper {
    width: 80%;
}

.user-message,
.bot-message {    
    max-width: 85%;
    padding: 12px 20px;
    margin-bottom: 15px;
    box-sizing: border-box;
    border-radius: 12px;
    word-break: break-word;
    width: fit-content; 
}

.user-message {
    background: #2f2f2f;
    float: right;
    border-radius: 12px 12px 0 12px;
}

.user-message:first-child {
    margin-top: 20px;
}

.bot-message {
    background: transparent;
    border-radius: 12px 12px 12px 0;
}

.message-content {
    width: 100%;
    font-size: 16px;
    color: white;
    overflow-x: hidden;
}

.user-message-content {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    hyphens: auto;
}

.default-message {
    padding: 20px;
    width: 100%;
    height: 60px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 25px;
    color: white;
}

.input-bar {
    background-color: var(--primary-color);
    padding: 10px;
    border-radius: 8px;
    width: 90%;
    margin-bottom: 20px;
}

.input-element {
    background: transparent;
    border: none;
    outline: none;
    color: white;
    width: 98%;
    padding: 5px;
    resize: none;
    min-height: 40px;
}

.chat-sidebar {
    width: 200px;
    background: var(--primary-color);
    padding: 1rem;
    height: 100vh;
    transition: width 0.2s ease-in-out;
    z-index: 3;
}

.chat-sidebar.collapsed {
    width: 44px;
}

@keyframes slideInRight {
    from { transform: translateX(50px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

@keyframes slideInLeft {
    from { transform: translateX(-50px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

/* Sidebar Styles */
.sidebar-head {
    padding: 2px 10px 6px 10px;
    display: flex;
    justify-content: space-around;
    align-items: center;
    border-bottom: 0.5px solid #3a3a3a;
}
.sidebar-head.collapsed {
    justify-content: center;
}
.sidebar-head-title {
    color: white;
    font-weight: bold;
    font-size: 17px;
    opacity: 0;
    width: 0;
    overflow: hidden;
    white-space: nowrap;
    transition: all 0.3s ease;
    background: linear-gradient(120deg, #00c6ff, #0072ff, #00c6ff, #0072ff, #00c6ff); 
    background-size: 200% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
}

.sidebar-head-title.active {
    opacity: 1;
    width: auto;
    margin-right: 10px;
    animation: gradientAnimation 5s linear infinite; 
}

@keyframes gradientAnimation {
    0% {
        background-position: 0 0; 
    }
    100% {
        background-position: 200% 0;
    }
}

.collapse-image {
    width: 30px;
    height: 30px;
    cursor: pointer;
    filter: grayscale(100%);
    transition: filter 0.2s ease;
    
}

.collapse-image:hover {
    filter: grayscale(0%);
}


/* Input Bar Styles */
.input-bar {
    display: flex;
    flex-direction: column;
    gap: 10px;
    background-color: var(--primary-color);
    padding: 10px;
    border-radius: 8px;
    width: 80%;
    margin-bottom: 20px;
}

.input-element {
    background-color: transparent;
    border: none;
    color: white;
    font-size: 16px;
    width: 98%;
    padding: 5px;
    resize: none;
    min-height: 40px;
    max-height: 100px;
    overflow-y: auto;
    scrollbar-width: thin;
}

.input-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
}

.model-container {
    display: flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    position: relative;
}

.model-image {
    width: 25px;
    height: 25px;
    transition: filter 0.3s ease;
    filter: grayscale(100%);
    background-color: var(--primary-color);
    z-index: 2;
}

.model-image:hover {
    filter: grayscale(0%);
}
.model-container:hover .model-image {
    filter: grayscale(0%);
}

.model-image.waiting {
    animation: shake 5s infinite;
}

.selected-model {
    font-size: 14px;
    color: #8f8f8f;
    transition: all 0.5s ease;
    position: relative;
    display: flex;
    align-items: center;
    transform: translateX(-20px);
}

.model-container:hover .selected-model {
    transform: translateX(0);
}

.selected-model::before {
    content: "←";
    font-size: 18px;
    padding-right: 5px;
    color: #8f8f8f;
    opacity: 0;
    transform: translateX(-5px);
    transition: opacity 0.8s ease, transform 0.5s ease;
}

.model-container:hover .selected-model::before {
    opacity: 1;
    transform: translateX(0);
}

.models-container {
    position: absolute;
    bottom: 30px;
    left: 0px;
    background-color: #2f2f2f;
    border: 1px solid var(--secondary-color);
    scrollbar-width: thin;
    scrollbar-color: #fff3 transparent;
    padding: 10px;
    width: 100%;
    max-width: 250px;
    color: white;
    max-height: 150px;
    overflow-y: auto;
    border-radius: 8px 8px 8px 0;
}

.models-container ul {
    list-style-type: none;
    padding: 0;
}

.models-container ul li {
    cursor: pointer;
    transition: color 0.3s ease;
}

.models-container ul li.active {
    color: var(--primary-blue);
}

.models-container ul li:hover {
    color: var(--primary-blue);
}

.send-icon {
    width: 30px;
    height: 30px;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 1px solid #3a3a3a;
    padding: 5px;
    border-radius: 50%;
    filter: grayscale(100%);
}

.send-icon:hover {
    filter: grayscale(0%);
    transform: rotate(-45deg);
    border-color: #4d6bfe;
}

@keyframes shake {
    0% { transform: rotate(0); }
    5% { transform: rotate(-20deg); }
    10% { transform: rotate(20deg); }
    15% { transform: rotate(-20deg); }
    20% { transform: rotate(0); }
    100% { transform: rotate(0); }
}

.footer {
    font-size: 12px;
    color: #8f8f8f;
}

/* Fade Transition */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>