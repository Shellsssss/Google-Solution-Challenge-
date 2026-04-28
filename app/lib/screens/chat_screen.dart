import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../l10n/app_strings.dart';
import '../providers/app_provider.dart';
import '../services/api_service.dart';
import '../services/tts_service.dart';
import '../theme/app_theme.dart';

class ChatMessage {
  final String role;     // 'user' | 'assistant'
  final String content;
  final bool   isError;

  const ChatMessage({
    required this.role,
    required this.content,
    this.isError = false,
  });

  Map<String, dynamic> toMap() => {'role': role, 'content': content};
}

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _controller  = TextEditingController();
  final _scrollCtrl  = ScrollController();
  final List<ChatMessage> _messages = [];
  bool _thinking = false;
  bool _ttsPlaying = false;

  @override
  void initState() {
    super.initState();
    TtsService().onStop = () {
      if (mounted) setState(() => _ttsPlaying = false);
    };
  }

  @override
  void dispose() {
    _controller.dispose();
    _scrollCtrl.dispose();
    TtsService().stop();
    super.dispose();
  }

  Future<void> _send([String? override]) async {
    final text = (override ?? _controller.text).trim();
    if (text.isEmpty || _thinking) return;

    final lang = context.read<AppProvider>().langCode;

    setState(() {
      _messages.add(ChatMessage(role: 'user', content: text));
      _thinking = true;
    });
    _controller.clear();
    _scrollToBottom();

    // Build history (exclude the message just added)
    final history = _messages
        .sublist(0, _messages.length - 1)
        .map((m) => m.toMap())
        .toList();

    final response = await ApiService().sendChatMessage(
      message:  text,
      history:  history,
      language: lang,
    );

    if (!mounted) return;

    setState(() {
      _thinking = false;
      if (response != null && response.isNotEmpty) {
        _messages.add(ChatMessage(role: 'assistant', content: response));
      } else {
        _messages.add(ChatMessage(
          role: 'assistant',
          content: AppStrings(lang).errorGeneric,
          isError: true,
        ));
      }
    });
    _scrollToBottom();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _speakMessage(String text) async {
    final lang = context.read<AppProvider>().langCode;
    if (_ttsPlaying) {
      await TtsService().stop();
      setState(() => _ttsPlaying = false);
    } else {
      setState(() => _ttsPlaying = true);
      await TtsService().speak(text, langCode: lang);
    }
  }

  void _clearChat() {
    setState(() => _messages.clear());
    TtsService().stop();
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<AppProvider>().langCode;
    final s    = AppStrings(lang);

    return Scaffold(
      backgroundColor: context.primaryBg,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(s.chatTitle),
            Text(s.chatHeaderTitle,
                style: TextStyle(
                    color: context.textSec, fontSize: 11,
                    fontWeight: FontWeight.normal)),
          ],
        ),
        automaticallyImplyLeading: false,
        actions: [
          if (_messages.isNotEmpty)
            IconButton(
              icon: Icon(Icons.delete_outline, color: context.textSec),
              tooltip: s.chatClear,
              onPressed: _clearChat,
            ),
        ],
      ),
      body: Column(
        children: [
          // Messages list
          Expanded(
            child: _messages.isEmpty
                ? _WelcomeState(s: s, onSuggestion: _send)
                : ListView.builder(
                    controller: _scrollCtrl,
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length + (_thinking ? 1 : 0),
                    itemBuilder: (_, i) {
                      if (i == _messages.length) {
                        return _ThinkingBubble(s: s);
                      }
                      final msg = _messages[i];
                      return _MessageBubble(
                        message:    msg,
                        onSpeak:    msg.role == 'assistant'
                            ? () => _speakMessage(msg.content)
                            : null,
                        ttsPlaying: _ttsPlaying,
                      );
                    },
                  ),
          ),

          // Disclaimer
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            color: context.warning.withValues(alpha: 0.06),
            child: Text(s.chatDisclaimer,
                textAlign: TextAlign.center,
                style: TextStyle(
                    color: context.textSec, fontSize: 10,
                    fontStyle: FontStyle.italic)),
          ),

          // Input bar
          SafeArea(
            child: Container(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
              decoration: BoxDecoration(
                color: context.secondaryBg,
                border: Border(top: BorderSide(color: context.border)),
              ),
              child: Row(children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    style: TextStyle(color: context.textPrimary, fontSize: 14),
                    maxLines: 3,
                    minLines: 1,
                    textCapitalization: TextCapitalization.sentences,
                    decoration: InputDecoration(
                      hintText: s.chatHint,
                      hintStyle: TextStyle(color: context.textSec),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(20),
                        borderSide: BorderSide(color: context.border),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(20),
                        borderSide: BorderSide(color: context.border),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(20),
                        borderSide: BorderSide(color: context.accent, width: 1.5),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 10),
                      fillColor: context.cardBg,
                      filled: true,
                    ),
                    onSubmitted: (_) => _send(),
                  ),
                ),
                const SizedBox(width: 8),
                // Send button
                GestureDetector(
                  onTap: _thinking ? null : () => _send(),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    width: 44, height: 44,
                    decoration: BoxDecoration(
                      color: _thinking
                          ? context.border
                          : context.accent,
                      shape: BoxShape.circle,
                    ),
                    child: _thinking
                        ? const Padding(
                            padding: EdgeInsets.all(12),
                            child: CircularProgressIndicator(
                                color: Colors.white, strokeWidth: 2))
                        : const Icon(Icons.send_rounded,
                            color: Colors.white, size: 20),
                  ),
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Welcome state with suggestions ───────────────────────────────────────────

class _WelcomeState extends StatelessWidget {
  final AppStrings s;
  final void Function(String) onSuggestion;

  const _WelcomeState({required this.s, required this.onSuggestion});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const SizedBox(height: 24),
          Container(
            width: 72, height: 72,
            decoration: BoxDecoration(
              color: context.accent.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.medical_information_outlined,
                color: context.accent, size: 36),
          ),
          const SizedBox(height: 16),
          Text(s.chatTitle,
              style: TextStyle(
                  color: context.textPrimary,
                  fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Text(s.chatWelcome,
              textAlign: TextAlign.center,
              style: TextStyle(
                  color: context.textSec, fontSize: 14, height: 1.6)),
          const SizedBox(height: 32),

          // Suggestion chips
          Text(s.chatTryAsking,
              style: TextStyle(
                  color: context.textSec, fontSize: 12,
                  fontWeight: FontWeight.w500)),
          const SizedBox(height: 12),
          _SuggestionChip(label: s.chatSuggestion1, onTap: () => onSuggestion(s.chatSuggestion1)),
          const SizedBox(height: 8),
          _SuggestionChip(label: s.chatSuggestion2, onTap: () => onSuggestion(s.chatSuggestion2)),
          const SizedBox(height: 8),
          _SuggestionChip(label: s.chatSuggestion3, onTap: () => onSuggestion(s.chatSuggestion3)),
        ],
      ),
    );
  }
}

class _SuggestionChip extends StatelessWidget {
  final String      label;
  final VoidCallback onTap;
  const _SuggestionChip({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: context.cardBg,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: context.border),
        ),
        child: Row(children: [
          Icon(Icons.chat_bubble_outline,
              color: context.accent, size: 16),
          const SizedBox(width: 10),
          Expanded(
            child: Text(label,
                style: TextStyle(
                    color: context.textPrimary, fontSize: 13)),
          ),
          Icon(Icons.arrow_forward_ios,
              color: context.textSec, size: 12),
        ]),
      ),
    );
  }
}

// ── Message bubbles ───────────────────────────────────────────────────────────

class _MessageBubble extends StatelessWidget {
  final ChatMessage message;
  final VoidCallback? onSpeak;
  final bool ttsPlaying;

  const _MessageBubble({
    required this.message,
    this.onSpeak,
    this.ttsPlaying = false,
  });

  @override
  Widget build(BuildContext context) {
    final isUser = message.role == 'user';

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment:
            isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isUser) ...[
            // Assistant avatar
            Container(
              width: 32, height: 32,
              margin: const EdgeInsets.only(right: 8),
              decoration: BoxDecoration(
                color: context.accent.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.medical_information_outlined,
                  color: context.accent, size: 16),
            ),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment:
                  isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                Container(
                  constraints: BoxConstraints(
                      maxWidth: MediaQuery.of(context).size.width * 0.75),
                  padding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: isUser
                        ? context.accent
                        : (message.isError
                            ? context.danger.withValues(alpha: 0.08)
                            : context.cardBg),
                    borderRadius: BorderRadius.only(
                      topLeft:     const Radius.circular(16),
                      topRight:    const Radius.circular(16),
                      bottomLeft:  Radius.circular(isUser ? 16 : 4),
                      bottomRight: Radius.circular(isUser ? 4 : 16),
                    ),
                    border: isUser
                        ? null
                        : Border.all(color: message.isError
                            ? context.danger.withValues(alpha: 0.3)
                            : context.border),
                  ),
                  child: Text(message.content,
                      style: TextStyle(
                          color: isUser ? Colors.white : context.textPrimary,
                          fontSize: 14, height: 1.5)),
                ),
                // TTS button for assistant messages
                if (!isUser && onSpeak != null) ...[
                  const SizedBox(height: 4),
                  GestureDetector(
                    onTap: onSpeak,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          ttsPlaying
                              ? Icons.stop_circle_outlined
                              : Icons.volume_up_outlined,
                          color: context.textSec, size: 14,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          ttsPlaying ? 'Stop' : 'Listen',
                          style: TextStyle(
                              color: context.textSec, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
          if (isUser) const SizedBox(width: 8),
        ],
      ),
    );
  }
}

class _ThinkingBubble extends StatelessWidget {
  final AppStrings s;
  const _ThinkingBubble({required this.s});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            width: 32, height: 32,
            margin: const EdgeInsets.only(right: 8),
            decoration: BoxDecoration(
              color: context.accent.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.medical_information_outlined,
                color: context.accent, size: 16),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: context.cardBg,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(16),
                topRight: Radius.circular(16),
                bottomRight: Radius.circular(16),
                bottomLeft: Radius.circular(4),
              ),
              border: Border.all(color: context.border),
            ),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              SizedBox(
                width: 16, height: 16,
                child: CircularProgressIndicator(
                    strokeWidth: 2, color: context.accent),
              ),
              const SizedBox(width: 10),
              Text(s.chatThinking,
                  style: TextStyle(
                      color: context.textSec, fontSize: 13,
                      fontStyle: FontStyle.italic)),
            ]),
          ),
        ],
      ),
    );
  }
}
